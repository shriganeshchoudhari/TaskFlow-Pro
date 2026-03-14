package com.taskflow.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP-based rate limiting filter for sensitive auth endpoints.
 *
 * Limits per remote IP address:
 *   POST /api/v1/auth/login    — 10 requests per 15 minutes
 *   POST /api/v1/auth/register — 5 requests per 1 hour
 *
 * Returns HTTP 429 with Retry-After header and JSON error body on violation.
 * Uses Bucket4j token-bucket algorithm with per-IP ConcurrentHashMap storage.
 * (For multi-instance deployments, replace the map with a Redis-backed cache.)
 */
@Component
@Order(2)   // Run after MdcTraceIdFilter (Order=1), before Spring Security
@Slf4j
public class RateLimitFilter implements Filter {

    private static final String LOGIN_PATH    = "/api/v1/auth/login";
    private static final String REGISTER_PATH = "/api/v1/auth/register";

    // Separate bucket maps per endpoint so limits are tracked independently
    private final Map<String, Bucket> loginBuckets    = new ConcurrentHashMap<>();
    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {

        HttpServletRequest  httpReq  = (HttpServletRequest)  request;
        HttpServletResponse httpResp = (HttpServletResponse) response;

        String method = httpReq.getMethod();
        String path   = httpReq.getRequestURI();

        if ("POST".equalsIgnoreCase(method)) {
            if (path.equals(LOGIN_PATH)) {
                if (!tryConsume(loginBuckets, getClientIp(httpReq), this::loginBucket)) {
                    rejectWithTooManyRequests(httpResp, 15 * 60);
                    return;
                }
            } else if (path.equals(REGISTER_PATH)) {
                if (!tryConsume(registerBuckets, getClientIp(httpReq), this::registerBucket)) {
                    rejectWithTooManyRequests(httpResp, 60 * 60);
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    // ── Bucket factories ────────────────────────────────────────────────────

    /** 10 tokens refilled every 15 minutes */
    private Bucket loginBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(15)));
        return Bucket.builder().addLimit(limit).build();
    }

    /** 5 tokens refilled every 1 hour */
    private Bucket registerBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    @FunctionalInterface
    interface BucketFactory { Bucket create(); }

    private boolean tryConsume(Map<String, Bucket> cache, String key, BucketFactory factory) {
        Bucket bucket = cache.computeIfAbsent(key, k -> factory.create());
        boolean allowed = bucket.tryConsume(1);
        if (!allowed) {
            log.warn("Rate limit exceeded for IP {} on path", key);
        }
        return allowed;
    }

    private void rejectWithTooManyRequests(HttpServletResponse resp, long retryAfterSeconds)
            throws IOException {
        resp.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        resp.setContentType(MediaType.APPLICATION_JSON_VALUE);
        resp.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        resp.getWriter().write("""
            {"status":429,"error":"TOO_MANY_REQUESTS","message":"Rate limit exceeded. Please try again later.","retryAfter":%d}
            """.formatted(retryAfterSeconds).strip());
    }

    /**
     * Extract the real client IP, respecting X-Forwarded-For from a reverse proxy.
     * Falls back to getRemoteAddr() when no forwarding header is present.
     */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}

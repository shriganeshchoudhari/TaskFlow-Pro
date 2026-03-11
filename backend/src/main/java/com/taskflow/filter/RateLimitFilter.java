package com.taskflow.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter for authentication endpoints.
 * Limits requests per IP address to prevent brute-force attacks.
 * <p>
 * Limits:
 * - /api/v1/auth/login: 10 requests per minute per IP
 * - /api/v1/auth/register: 5 requests per minute per IP
 * - All other /api/v1/auth/*: 20 requests per minute per IP
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalAuthBuckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/v1/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        Bucket bucket;
        if (path.contains("/auth/login")) {
            bucket = loginBuckets.computeIfAbsent(clientIp, k -> createBucket(10, 1));
        } else if (path.contains("/auth/register")) {
            bucket = registerBuckets.computeIfAbsent(clientIp, k -> createBucket(5, 1));
        } else {
            bucket = generalAuthBuckets.computeIfAbsent(clientIp, k -> createBucket(20, 1));
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("""
                {"error": "TOO_MANY_REQUESTS", "message": "Rate limit exceeded. Please try again later."}
                """);
        }
    }

    private Bucket createBucket(int capacity, int refillMinutes) {
        Bandwidth limit = Bandwidth.classic(capacity,
            Refill.greedy(capacity, Duration.ofMinutes(refillMinutes)));
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

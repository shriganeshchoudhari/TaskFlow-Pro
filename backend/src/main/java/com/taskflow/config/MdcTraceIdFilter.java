package com.taskflow.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that injects a correlation ID (traceId) into the MDC for every request.
 * The traceId is included in every structured log line via the pattern in application.yml:
 *   "traceId":"%X{traceId}"
 *
 * The traceId is sourced from the incoming X-Trace-Id header when present (e.g. from an
 * API gateway or upstream service), otherwise a new random 16-hex-char ID is generated.
 * The same traceId is echoed back in the X-Trace-Id response header so callers can
 * correlate logs with their own request tracking.
 */
@Component
@Order(1)
@Slf4j
public class MdcTraceIdFilter implements Filter {

    private static final String TRACE_ID_HEADER  = "X-Trace-Id";
    private static final String TRACE_ID_MDC_KEY = "traceId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {

        HttpServletRequest  httpReq  = (HttpServletRequest)  request;
        HttpServletResponse httpResp = (HttpServletResponse) response;

        String traceId = httpReq.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            // Generate a compact 16-char hex ID — short enough to read in logs
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }

        MDC.put(TRACE_ID_MDC_KEY, traceId);
        // Echo back so the caller can correlate their request with backend logs
        httpResp.setHeader(TRACE_ID_HEADER, traceId);

        try {
            chain.doFilter(request, response);
        } finally {
            // Always clean up — MDC is ThreadLocal and leaks across thread-pool reuse
            MDC.remove(TRACE_ID_MDC_KEY);
        }
    }
}

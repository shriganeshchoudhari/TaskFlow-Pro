package com.taskflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register under /api/v1/ws to match the frontend VITE_API_URL base path.
        // The frontend builds wsUrl as `${VITE_API_URL}/ws` where
        // VITE_API_URL = http://localhost:8080/api/v1, so the effective path
        // must be /api/v1/ws — not /ws.
        registry.addEndpoint("/api/v1/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        org.springframework.context.ApplicationContext context =
                            com.taskflow.TaskflowApplication.getContext();

                        if (context != null) {
                            com.taskflow.security.JwtTokenProvider jwtTokenProvider =
                                context.getBean(com.taskflow.security.JwtTokenProvider.class);
                            com.taskflow.security.UserDetailsServiceImpl userDetailsService =
                                context.getBean(com.taskflow.security.UserDetailsServiceImpl.class);

                            if (jwtTokenProvider.isTokenValid(token)) {
                                String email = jwtTokenProvider.extractEmail(token);
                                org.springframework.security.core.userdetails.UserDetails userDetails =
                                    userDetailsService.loadUserByUsername(email);

                                org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());

                                accessor.setUser(authentication);
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}

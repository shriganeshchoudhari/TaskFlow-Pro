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
        // Enable a simple memory-based message broker to carry the messages back to the client on destinations prefixed with /topic and /queue
        config.enableSimpleBroker("/topic", "/queue");
        
        // Designates the prefix for messages that are bound for methods annotated with @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
        
        // Designates the prefix for messages sent to specific users
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws" endpoint, enabling SockJS fallback options so that alternate transports can be used if WebSocket is not available.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Will connect this to proper CORS config later
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        // Accessing beans via context since we can't inject them easily into this anonymous class without making config classes complex
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

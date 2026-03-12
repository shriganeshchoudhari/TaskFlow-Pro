package com.taskflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.context.ApplicationContext;

@SpringBootApplication
@EnableScheduling
public class TaskflowApplication {

    private static ApplicationContext context;

    public static void main(String[] args) {
        context = SpringApplication.run(TaskflowApplication.class, args);
    }

    public static ApplicationContext getContext() {
        return context;
    }
}

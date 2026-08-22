package com.example.murmur;

import org.springframework.boot.SpringApplication;

public class TestMurmurApplication {

    public static void main(String[] args) {
        SpringApplication.from(MurmurApplication::main)
                .with(TestcontainersConfiguration.class)
                .run(args);
    }
}

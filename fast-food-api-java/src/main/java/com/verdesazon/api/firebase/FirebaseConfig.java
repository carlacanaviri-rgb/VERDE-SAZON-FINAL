package com.verdesazon.api.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.path:}")
    private String credentialsPath;

    @Bean
    public Firestore firestore() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(resolveCredentialsStream()))
                    .build();
            FirebaseApp.initializeApp(options);
        }
        return FirestoreClient.getFirestore();
    }

    private InputStream resolveCredentialsStream() throws IOException {
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            return Files.newInputStream(Path.of(credentialsPath));
        }

        Path legacyPath = Path.of("..", "fast-food-api", "src", "firebase-admin.json").normalize();
        if (Files.exists(legacyPath)) {
            return Files.newInputStream(legacyPath);
        }

        ClassPathResource classPathResource = new ClassPathResource("firebase-admin.json");
        if (classPathResource.exists()) {
            return classPathResource.getInputStream();
        }

        String envCredentials = System.getenv("FIREBASE_ADMIN_JSON");
        if (envCredentials != null && !envCredentials.isBlank()) {
            return new ByteArrayInputStream(envCredentials.getBytes());
        }

        throw new IllegalStateException("No se encontro firebase-admin.json. Define firebase.credentials.path o FIREBASE_ADMIN_JSON");
    }
}


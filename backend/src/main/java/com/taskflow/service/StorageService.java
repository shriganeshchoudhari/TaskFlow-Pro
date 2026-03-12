package com.taskflow.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    
    /**
     * Stores a file and returns its storage URL/path.
     */
    String storeFile(MultipartFile file);

    /**
     * Loads a file as a Resource.
     */
    Resource loadFileAsResource(String fileName);

    /**
     * Deletes a file.
     */
    void deleteFile(String fileName);
}

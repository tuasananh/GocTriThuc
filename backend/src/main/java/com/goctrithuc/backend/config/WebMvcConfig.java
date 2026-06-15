package com.goctrithuc.backend.config;

import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
        .addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(
            new PathResourceResolver() {
              @Override
              protected Resource getResource(String resourcePath, Resource location)
                  throws IOException {
                Resource requestedResource = location.createRelative(resourcePath);

                // Serve physical file if it exists (e.g. /assets/index.js, /favicon.svg)
                if (requestedResource.exists() && requestedResource.isReadable()) {
                  return requestedResource;
                }

                // Allow API routes to fall through (and return 404 if not found)
                if (resourcePath.startsWith("api/") || resourcePath.startsWith("api")) {
                  return null;
                }

                // Fallback unrecognized routes to index.html
                return new ClassPathResource("/static/index.html");
              }
            });
  }
}

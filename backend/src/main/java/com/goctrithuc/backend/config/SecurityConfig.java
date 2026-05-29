package com.goctrithuc.backend.config;

import com.goctrithuc.backend.services.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HeaderWriterLogoutHandler;
import org.springframework.security.web.header.writers.ClearSiteDataHeaderWriter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private final CustomOAuth2UserService customOAuth2UserService;

  // Inject the URL from application.yml
  @Value("${app.frontend.oauth2-redirect-uri}")
  private String oauth2SuccessUrl;

  public SecurityConfig(CustomOAuth2UserService customOAuth2UserService) {
    this.customOAuth2UserService = customOAuth2UserService;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    HeaderWriterLogoutHandler clearSiteData =
        new HeaderWriterLogoutHandler(
            new ClearSiteDataHeaderWriter(ClearSiteDataHeaderWriter.Directive.ALL));
    http.csrf(CsrfConfigurer::spa)
        .authorizeHttpRequests(
            auth ->
                auth // Allow accessing frontend resources
                    .requestMatchers(
                        HttpMethod.GET,
                        "/",
                        "/index.html",
                        "/dashboard",
                        "/login",
                        "/favicon.svg",
                        "/icons.svg",
                        "/assets/**")
                    .permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/users/me")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/users/{id}")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/courses")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/courses/{id}")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
        .oauth2Login(
            oauth2 ->
                oauth2
                    .userInfoEndpoint(
                        userInfo ->
                            userInfo.userService(
                                customOAuth2UserService) // Use our custom saving logic
                        )
                    .defaultSuccessUrl(oauth2SuccessUrl, true) // Redirect back to Vite React app
                    .loginPage("/login"))
        .logout(
            logout ->
                logout
                    .logoutUrl("/api/logout")
                    .addLogoutHandler(clearSiteData)
                    .logoutSuccessHandler(
                        (request, response, authentication) -> {
                          response.setStatus(HttpServletResponse.SC_OK);
                        }));

    return http.build();
  }
}

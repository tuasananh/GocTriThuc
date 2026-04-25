package com.goctrithuc.backend.services;

import java.util.HashMap;
import java.util.Map;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  private final UserPersistenceService userPersistenceService;

  private final GithubEmailFetcherService githubEmailFetcherService;

  public CustomOAuth2UserService(
      UserPersistenceService userPersistenceService,
      GithubEmailFetcherService githubEmailFetcherService) {
    this.userPersistenceService = userPersistenceService;
    this.githubEmailFetcherService = githubEmailFetcherService;
  }

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = super.loadUser(userRequest);

    // Print all attributes for debugging
    System.out.println("OAuth2User attributes:");
    oAuth2User.getAttributes().forEach((key, value) -> System.out.println(key + ": " + value));

    String providerName = userRequest.getClientRegistration().getRegistrationId();

    String providerUserId =
        switch (providerName) {
          case "google" -> oAuth2User.getAttribute("sub");
          case "github" -> {
            Object idObj = oAuth2User.getAttribute("id");
            if (idObj == null) {
              yield null;
            }
            yield idObj.toString();
          }
          default -> throw new IllegalArgumentException("Unsupported provider: " + providerName);
        };

    if (providerUserId == null) {
      throw new OAuth2AuthenticationException(
          "Missing provider user ID for provider: " + providerName);
    }

    String email = getEmail(providerName, oAuth2User, userRequest.getAccessToken().getTokenValue());

    if (email == null || email.isBlank()) {
      throw new OAuth2AuthenticationException(
          "Unable to retrieve email for provider: " + providerName);
    }

    String name = oAuth2User.getAttribute("name"); // this works for both Google and GitHub

    if (name == null || name.isBlank()) {
      name = email.split("@")[0]; // Fallback to using the email prefix as the name
    }

    String avatar =
        switch (providerName) {
          case "google" -> oAuth2User.getAttribute("picture");
          case "github" -> oAuth2User.getAttribute("avatar_url");
          default -> throw new IllegalArgumentException("Unsupported provider: " + providerName);
        };

    userPersistenceService.syncUser(providerName, providerUserId, email, name, avatar);

    Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
    attributes.put("sub", providerUserId);
    attributes.put("email", email);
    attributes.put("name", name);
    attributes.put("avatar", avatar);
    return new DefaultOAuth2User(oAuth2User.getAuthorities(), attributes, "sub");
  }

  private String getEmail(String providerName, OAuth2User oauth2User, String token) {
    // Should work for Google
    String primaryEmailAddress = oauth2User.getAttribute("email");

    if (primaryEmailAddress == null || primaryEmailAddress.isBlank()) {
      if (providerName.equals("github")) {
        primaryEmailAddress = githubEmailFetcherService.fetchPrimaryEmailAddress(token);
      }
    }

    return primaryEmailAddress;
  }
}

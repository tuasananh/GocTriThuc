package com.goctrithuc.backend.services;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  private final UserPersistenceService userPersistenceService;

  public CustomOAuth2UserService(UserPersistenceService userPersistenceService) {
    this.userPersistenceService = userPersistenceService;
  }

  @Override
  // No @Transactional here!
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    // 1. External call to Google (NO database connection held yet)
    OAuth2User oAuth2User = super.loadUser(userRequest);

    String providerName = userRequest.getClientRegistration().getRegistrationId();
    String providerUserId = oAuth2User.getAttribute("sub");
    String email = oAuth2User.getAttribute("email");
    String name = oAuth2User.getAttribute("name");
    String avatar = oAuth2User.getAttribute("picture");

    // 2. Call the persistence service (This is where the Transaction starts)
    userPersistenceService.syncUser(providerName, providerUserId, email, name, avatar);

    return oAuth2User;
  }
}

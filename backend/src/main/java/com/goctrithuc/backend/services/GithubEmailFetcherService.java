package com.goctrithuc.backend.services;

import java.util.List;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GithubEmailFetcherService {
  private static final String EMAILS_URL = "https://api.github.com/user/emails";
  private static final String BEARER_PREFIX = "Bearer ";

  private final RestClient restClient;

  public GithubEmailFetcherService(RestClient restClient) {
    this.restClient = restClient;
  }

  public String fetchPrimaryEmailAddress(String token) {
    List<GitHubEmailVm> emailVmList =
        restClient
            .get()
            .uri(EMAILS_URL)
            .header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token)
            .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
            .retrieve()
            .body(new ParameterizedTypeReference<>() {});

    if (emailVmList == null || emailVmList.isEmpty()) {
      return null;
    }

    return emailVmList.stream()
        .filter(GitHubEmailVm::primary)
        .findFirst()
        .map(GitHubEmailVm::email)
        .orElse(null);
  }

  private record GitHubEmailVm(String email, Boolean primary) {}
}

package com.goctrithuc.backend.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
  @GetMapping(value = "/{path:[^\\.]*}")
  public String forward() {
    return "forward:/index.html";
  }
}

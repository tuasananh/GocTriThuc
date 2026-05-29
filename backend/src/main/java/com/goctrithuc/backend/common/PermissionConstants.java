package com.goctrithuc.backend.common;

public final class PermissionConstants {
  public static final long ADMIN = 0x01L;
  public static final long MANAGE_OWN_COURSES = 0x02L;
  public static final long ENROLL_COURSE = 0x04L;
  public static final long MANAGE_OWN_QUESTIONS = 0x08L;
  public static final long MANAGE_OWN_TESTS = 0x10L;
  public static final long ACCESS_TESTS = 0x20L;

  private PermissionConstants() {}
}

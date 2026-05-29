package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import java.util.Collection;
import org.springframework.data.jpa.domain.Specification;

public final class CourseSpecifications {

  private CourseSpecifications() {}

  public static Specification<Course> titleContains(String search) {
    String pattern = "%" + search.toLowerCase() + "%";
    return (root, query, cb) -> cb.like(cb.lower(root.get("title")), pattern);
  }

  public static Specification<Course> visibilityEquals(CourseVisibility visibility) {
    return (root, query, cb) -> cb.equal(root.get("visibility"), visibility);
  }

  public static Specification<Course> visibilityIn(Collection<CourseVisibility> visibilities) {
    return (root, query, cb) -> root.get("visibility").in(visibilities);
  }

  public static Specification<Course> authorIdEquals(Long authorId) {
    return (root, query, cb) -> cb.equal(root.get("author").get("id"), authorId);
  }
}

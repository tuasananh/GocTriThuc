package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.CreateModuleRequest;
import com.goctrithuc.backend.dtos.LessonSummaryResponse;
import com.goctrithuc.backend.dtos.ModuleResponse;
import com.goctrithuc.backend.dtos.UpdateModuleRequest;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.ModuleEntity;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.LessonRepository;
import com.goctrithuc.backend.repositories.ModuleRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ModuleService {

  private final ModuleRepository moduleRepo;
  private final CourseRepository courseRepo;
  private final LessonRepository lessonRepo;
  private final PermissionService permissionService;

  public ModuleService(
      ModuleRepository moduleRepo,
      CourseRepository courseRepo,
      LessonRepository lessonRepo,
      PermissionService permissionService) {
    this.moduleRepo = moduleRepo;
    this.courseRepo = courseRepo;
    this.lessonRepo = lessonRepo;
    this.permissionService = permissionService;
  }

  @Transactional
  public ModuleResponse createModule(Long courseId, CreateModuleRequest req, Long userId) {
    Course course =
        courseRepo
            .findById(courseId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Only course author or admin can add modules");
    }

    int nextOrder = moduleRepo.countByCourseId(courseId);
    ModuleEntity m = new ModuleEntity(course, req.title(), nextOrder);
    ModuleEntity saved = moduleRepo.save(m);
    return new ModuleResponse(saved.getId(), saved.getTitle(), saved.getOrder(), new ArrayList<>());
  }

  @Transactional
  public ModuleResponse updateModule(Long id, UpdateModuleRequest req, Long userId) {
    ModuleEntity m =
        moduleRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = m.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Only course author or admin can update modules");
    }

    m.setTitle(req.title());
    ModuleEntity saved = moduleRepo.save(m);

    List<LessonSummaryResponse> lessons =
        lessonRepo.findByModuleIdOrderByOrderAsc(id).stream()
            .map(l -> new LessonSummaryResponse(l.getId(), l.getTitle(), l.getType(), l.getOrder()))
            .toList();

    return new ModuleResponse(saved.getId(), saved.getTitle(), saved.getOrder(), lessons);
  }

  @Transactional
  public void deleteModule(Long id, Long userId) {
    ModuleEntity m =
        moduleRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = m.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Only course author or admin can delete modules");
    }

    moduleRepo.delete(m);

    // Re-index remaining modules sequence (giữ cho orders liên tục từ 0 -> N-1)
    List<ModuleEntity> remaining = moduleRepo.findByCourseIdOrderByOrderAsc(course.getId());
    for (int i = 0; i < remaining.size(); i++) {
      remaining.get(i).setOrder(i);
      moduleRepo.save(remaining.get(i));
    }
  }

  @Transactional
  public void reorderModule(Long id, String direction, Long userId) {
    ModuleEntity m =
        moduleRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = m.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    int currentOrder = m.getOrder();
    List<ModuleEntity> siblings = moduleRepo.findByCourseIdOrderByOrderAsc(course.getId());

    int index = -1;
    for (int i = 0; i < siblings.size(); i++) {
      if (siblings.get(i).getId().equals(id)) {
        index = i;
        break;
      }
    }

    if (index == -1) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Sequence corruption");
    }

    if ("up".equalsIgnoreCase(direction)) {
      if (index == 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move first module up");
      }
      ModuleEntity prev = siblings.get(index - 1);
      m.setOrder(prev.getOrder());
      prev.setOrder(currentOrder);
      moduleRepo.save(m);
      moduleRepo.save(prev);
    } else if ("down".equalsIgnoreCase(direction)) {
      if (index == siblings.size() - 1) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move last module down");
      }
      ModuleEntity next = siblings.get(index + 1);
      m.setOrder(next.getOrder());
      next.setOrder(currentOrder);
      moduleRepo.save(m);
      moduleRepo.save(next);
    } else {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Direction must be 'up' or 'down'");
    }
  }
}

package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.LessonSummaryResponse;
import com.goctrithuc.backend.dtos.ModuleResponse;
import com.goctrithuc.backend.entities.ModuleEntity;
import com.goctrithuc.backend.repositories.ModuleRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurriculumService {

  private final ModuleRepository moduleRepo;

  public CurriculumService(ModuleRepository moduleRepo) {
    this.moduleRepo = moduleRepo;
  }

  @Transactional(readOnly = true)
  public List<ModuleResponse> getModulesWithLessons(Long courseId) {
    List<ModuleEntity> modules = moduleRepo.findByCourseIdOrderByOrderAsc(courseId);
    return modules.stream()
        .map(
            m -> {
              List<LessonSummaryResponse> lessons =
                  m.getLessons().stream()
                      .map(
                          l ->
                              new LessonSummaryResponse(
                                  l.getId(), l.getTitle(), l.getType(), l.getOrder()))
                      .toList();
              return new ModuleResponse(m.getId(), m.getTitle(), m.getOrder(), lessons);
            })
        .toList();
  }
}

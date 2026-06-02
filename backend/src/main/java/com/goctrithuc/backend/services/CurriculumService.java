package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.LessonSummaryResponse;
import com.goctrithuc.backend.dtos.ModuleResponse;
import com.goctrithuc.backend.entities.ModuleEntity;
import com.goctrithuc.backend.repositories.LessonCompletionRepository;
import com.goctrithuc.backend.repositories.ModuleRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurriculumService {

  private final ModuleRepository moduleRepo;
  private final LessonCompletionRepository completionRepo;

  public CurriculumService(ModuleRepository moduleRepo, LessonCompletionRepository completionRepo) {
    this.moduleRepo = moduleRepo;
    this.completionRepo = completionRepo;
  }

  @Transactional(readOnly = true)
  public List<ModuleResponse> getModulesWithLessons(Long courseId, Long userId) {
    List<ModuleEntity> modules = moduleRepo.findByCourseIdOrderByOrderAsc(courseId);
    List<Long> completedLessonIds =
        completionRepo.findCompletedLessonIdsByUserIdAndCourseId(userId, courseId);
    Set<Long> completedSet = new HashSet<>(completedLessonIds);

    return modules.stream()
        .map(
            m -> {
              List<LessonSummaryResponse> lessons =
                  m.getLessons().stream()
                      .map(
                          l ->
                              new LessonSummaryResponse(
                                  l.getId(),
                                  l.getTitle(),
                                  l.getType(),
                                  l.getOrder(),
                                  completedSet.contains(l.getId())))
                      .toList();
              return new ModuleResponse(m.getId(), m.getTitle(), m.getOrder(), lessons);
            })
        .toList();
  }
}

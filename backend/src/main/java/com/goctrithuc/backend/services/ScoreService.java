package com.goctrithuc.backend.services;

import com.goctrithuc.backend.entities.McQuestionEntity;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ScoreService {

  public double scoreAnswer(McQuestionEntity mc, int[] studentAnswer, Double point) {
    if (studentAnswer == null || studentAnswer.length == 0) {
      return 0.0;
    }
    boolean correct =
        Arrays.equals(
            Arrays.stream(studentAnswer).sorted().toArray(),
            Arrays.stream(mc.getCorrectChoices()).sorted().toArray());
    return correct ? (point != null ? point : 1.0) : 0.0;
  }

  public double calculateTotalScore(
      List<McQuestionEntity> questions, List<int[]> studentAnswers, List<Double> points) {
    if (questions == null || questions.isEmpty()) {
      return 0.0;
    }

    if (points == null) {
      points = List.of();
    }

    boolean isWeighted = !points.isEmpty();

    if (!isWeighted) {
      double correctCount = 0;
      for (int i = 0; i < questions.size(); i++) {
        McQuestionEntity mc = questions.get(i);
        int[] ans = i < studentAnswers.size() ? studentAnswers.get(i) : null;
        double qScore = scoreAnswer(mc, ans, 1.0);
        if (qScore > 0.0) {
          correctCount++;
        }
      }
      return (correctCount / questions.size()) * 100.0;
    } else {
      double totalPoints = 0.0;
      double earnedPoints = 0.0;
      for (int i = 0; i < questions.size(); i++) {
        McQuestionEntity mc = questions.get(i);
        int[] ans = i < studentAnswers.size() ? studentAnswers.get(i) : null;
        Double pt = i < points.size() ? points.get(i) : null;
        double weight = pt != null ? pt : 1.0;

        totalPoints += weight;
        earnedPoints += scoreAnswer(mc, ans, weight);
      }
      if (totalPoints == 0.0) {
        return 0.0;
      }
      return (earnedPoints / totalPoints) * 100.0;
    }
  }
}

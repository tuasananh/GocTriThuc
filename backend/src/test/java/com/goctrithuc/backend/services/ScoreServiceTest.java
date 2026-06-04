package com.goctrithuc.backend.services;

import static org.assertj.core.api.Assertions.assertThat;

import com.goctrithuc.backend.entities.McQuestionEntity;
import java.util.List;
import org.junit.jupiter.api.Test;

public class ScoreServiceTest {

  private final ScoreService scoreService = new ScoreService();

  @Test
  void singleChoiceCorrect() {
    McQuestionEntity mc = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {0}, true);
    double score = scoreService.scoreAnswer(mc, new int[] {0}, 5.0);
    assertThat(score).isEqualTo(5.0);
  }

  @Test
  void singleChoiceWrong() {
    McQuestionEntity mc = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {0}, true);
    double score = scoreService.scoreAnswer(mc, new int[] {1}, 5.0);
    assertThat(score).isEqualTo(0.0);
  }

  @Test
  void multiChoiceExactMatch() {
    McQuestionEntity mc =
        new McQuestionEntity(null, new String[] {"A", "B", "C"}, new int[] {0, 2}, false);
    // Student answers in different order: {2, 0}
    double score = scoreService.scoreAnswer(mc, new int[] {2, 0}, 10.0);
    assertThat(score).isEqualTo(10.0);
  }

  @Test
  void multiChoicePartial() {
    McQuestionEntity mc =
        new McQuestionEntity(null, new String[] {"A", "B", "C"}, new int[] {0, 2}, false);
    // Student only selects {0}
    double score = scoreService.scoreAnswer(mc, new int[] {0}, 10.0);
    assertThat(score).isEqualTo(0.0);
  }

  @Test
  void unweightedMode() {
    McQuestionEntity mc1 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {0}, true);
    McQuestionEntity mc2 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {1}, true);
    McQuestionEntity mc3 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {0}, true);

    List<McQuestionEntity> questions = List.of(mc1, mc2, mc3);
    List<int[]> studentAnswers =
        List.of(new int[] {0}, new int[] {0}, new int[] {0}); // 2 correct, 1 wrong
    List<Double> points = List.of(); // Empty points list triggers unweighted mode

    double totalScore = scoreService.calculateTotalScore(questions, studentAnswers, points);
    // (2 / 3) * 100 = 66.6666...
    assertThat(totalScore).isEqualTo(66.66666666666666);
  }

  @Test
  void weightedMode() {
    McQuestionEntity mc1 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {0}, true);
    McQuestionEntity mc2 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {1}, true);
    McQuestionEntity mc3 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {0}, true);

    List<McQuestionEntity> questions = List.of(mc1, mc2, mc3);
    List<int[]> studentAnswers =
        List.of(new int[] {0}, new int[] {0}, new int[] {0}); // mc1 correct, mc2 wrong, mc3 correct
    List<Double> points =
        List.of(1.5, 3.0, 5.5); // Total points = 10.0. Earned = 1.5 + 0.0 + 5.5 = 7.0

    double totalScore = scoreService.calculateTotalScore(questions, studentAnswers, points);
    assertThat(totalScore).isEqualTo(70.0);
  }

  @Test
  void calculateTotalScoreWithNullPointsDoesNotNpe() {
    // Before fix: iterating a null points list throws NullPointerException.
    // After fix: null treated as unweighted mode.
    McQuestionEntity mc1 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {0}, true);
    McQuestionEntity mc2 = new McQuestionEntity(null, new String[] {"A", "B"}, new int[] {1}, true);

    List<McQuestionEntity> questions = List.of(mc1, mc2);
    List<int[]> studentAnswers = List.of(new int[] {0}, new int[] {1}); // both correct

    // null points → unweighted mode → (2/2)*100 = 100.0
    double score = scoreService.calculateTotalScore(questions, studentAnswers, null);
    assertThat(score).isEqualTo(100.0);
  }

  @Test
  void calculateTotalScoreWithEmptyQuestionsReturnsZero() {
    double score = scoreService.calculateTotalScore(List.of(), List.of(), null);
    assertThat(score).isEqualTo(0.0);
  }
}

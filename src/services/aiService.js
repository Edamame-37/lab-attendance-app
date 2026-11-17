
import sentimentModule from '../../ai/sentiment';
import model from '../../ai/model-edom.json';

const { createSentimentClassifier } = sentimentModule;

const classifySentiment = createSentimentClassifier(model);

export function analyzeSentiment(text) {
  const result = classifySentiment(text);

  return {
    category: result.label,
    status: result.status,
    scores: result.scores,
    scoreType: result.scoreType,
    experimental: result.experimental,
  };
}

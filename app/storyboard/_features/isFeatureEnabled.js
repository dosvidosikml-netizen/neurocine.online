import { STORYBOARD_FEATURES } from "./config";

export function isFeatureEnabled(featureName) {
  return STORYBOARD_FEATURES[featureName] === true;
}

import R from 'ramda';
import { AppFeature } from '@/src/types';

const features = [APP_FEATURES];

export default R.reduce(R.mergeWith(R.concat), {} as AppFeature, features);

/**
 * Firebase Functions - Main Entry Point
 * PR-30: AI Canvas Agent
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { aiCanvasCommand } from './ai-proxy';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Cloud Functions
export { aiCanvasCommand };


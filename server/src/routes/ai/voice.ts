import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { voiceAssistant } from '../../services/voice/voiceAssistant';
import { logger } from '../../../utils/logger';
import multer from 'multer';

const router = Router();
const upload = multer();

/**
 * @swagger
 * /api/ai/voice/process-audio:
 *   post:
 *     summary: Process audio input and return a voice assistant response
 *     tags: [AI Voice Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (WAV, MP3, etc.)
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID for continuing a conversation
 *     responses:
 *       200:
 *         description: Voice assistant response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: Session ID for continuing the conversation
 *                 textResponse:
 *                   type: string
 *                   description: Text response from the assistant
 *                 audioResponse:
 *                   type: string
 *                   format: binary
 *                   description: Audio response (if enabled)
 *                 followUpQuestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Suggested follow-up questions
 *                 context:
 *                   type: object
 *                   description: Updated conversation context
 */
router.post(
  '/process-audio',
  authenticateJWT,
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const sessionId = req.body.sessionId;
      const userId = req.user?.id;
      const businessId = req.user?.businessId;

      const response = await voiceAssistant.processAudio(
        req.file.buffer,
        sessionId,
        { userId, businessId }
      );

      // Prepare the response
      const result: any = {
        sessionId: response.sessionId,
        textResponse: response.textResponse,
        followUpQuestions: response.followUpQuestions,
        context: response.context,
      };

      // If there's an audio response, send it as binary
      if (response.audioResponse) {
        res.set('Content-Type', 'audio/mp3');
        return res.send(response.audioResponse);
      }

      // Otherwise, send JSON
      return res.json(result);
    } catch (error) {
      logger.error('Error processing audio:', error);
      return res.status(500).json({ error: 'Failed to process audio' });
    }
  }
);

/**
 * @swagger
 * /api/ai/voice/process-text:
 *   post:
 *     summary: Process text input and return a voice assistant response
 *     tags: [AI Voice Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text input to process
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID for continuing a conversation
 *               includeAudio:
 *                 type: boolean
 *                 description: Whether to include audio response
 *                 default: false
 *     responses:
 *       200:
 *         description: Voice assistant response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: Session ID for continuing the conversation
 *                 textResponse:
 *                   type: string
 *                   description: Text response from the assistant
 *                 audioResponse:
 *                   type: string
 *                   format: binary
 *                   description: Audio response (if enabled)
 *                 followUpQuestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Suggested follow-up questions
 *                 context:
 *                   type: object
 *                   description: Updated conversation context
 */
router.post(
  '/process-text',
  authenticateJWT,
  async (req, res) => {
    try {
      const { text, sessionId, includeAudio = false } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text input is required' });
      }

      const userId = req.user?.id;
      const businessId = req.user?.businessId;

      // If audio is requested, enable it for this request
      if (includeAudio) {
        voiceAssistant['options'].enableVoiceResponse = true;
      }

      const response = await voiceAssistant.processText(
        text,
        sessionId,
        { userId, businessId }
      );

      // Prepare the response
      const result: any = {
        sessionId: response.sessionId,
        textResponse: response.textResponse,
        followUpQuestions: response.followUpQuestions,
        context: response.context,
      };

      // If audio was requested and generated, send it as binary
      if (includeAudio && response.audioResponse) {
        res.set('Content-Type', 'audio/mp3');
        return res.send(response.audioResponse);
      }

      // Otherwise, send JSON
      return res.json(result);
    } catch (error) {
      logger.error('Error processing text:', error);
      return res.status(500).json({ error: 'Failed to process text' });
    }
  }
);

/**
 * @swagger
 * /api/ai/voice/sessions/{sessionId}:
 *   get:
 *     summary: Get session information
 *     tags: [AI Voice Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 lastActive:
 *                   type: string
 *                   format: date-time
 *                 conversationHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         enum: [user, assistant]
 *                       content:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */
router.get(
  '/sessions/:sessionId',
  authenticateJWT,
  (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = voiceAssistant['getSession'](sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Only allow users to access their own sessions
      const userId = req.user?.id;
      if (session.context.userId && session.context.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({
        sessionId: session.context.sessionId,
        lastActive: new Date(session.lastActive).toISOString(),
        conversationHistory: session.conversationHistory.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      });
    } catch (error) {
      logger.error('Error getting session:', error);
      return res.status(500).json({ error: 'Failed to get session' });
    }
  }
);

/**
 * @swagger
 * /api/ai/voice/sessions/{sessionId}:
 *   delete:
 *     summary: End a session
 *     tags: [AI Voice Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to end
 *     responses:
 *       200:
 *         description: Session ended successfully
 *       404:
 *         description: Session not found
 */
router.delete(
  '/sessions/:sessionId',
  authenticateJWT,
  (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = voiceAssistant['getSession'](sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Only allow users to end their own sessions
      const userId = req.user?.id;
      if (session.context.userId && session.context.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      voiceAssistant['endSession'](sessionId);
      return res.json({ message: 'Session ended successfully' });
    } catch (error) {
      logger.error('Error ending session:', error);
      return res.status(500).json({ error: 'Failed to end session' });
    }
  }
);

export default router;

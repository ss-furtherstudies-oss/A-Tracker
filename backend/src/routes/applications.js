const express = require('express');
const router = express.Router();
const prisma = require('../utils/db');
const auditLogger = require('../middleware/auditLog');

// Get all applications
router.get('/', async (req, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      include: { person: true, program: true }
    });
    res.json(apps);
  } catch (error) {
    next(error);
  }
});

// Update Application (State Machine & Automation)
router.patch('/:id', auditLogger('Application'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, offer_accepted_bool } = req.body;

    const existingApp = await prisma.application.findUnique({
      where: { id },
      include: { person: true, program: true }
    });

    if (!existingApp) return res.status(404).json({ error: 'Application not found' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Application status 
      // State Machine: DRAFT -> SUBMITTED -> IN_REVIEW -> DECISION_PENDING -> ACCEPTED/REJECTED
      const updatedApp = await tx.application.update({
        where: { id },
        data: {
          status: status || existingApp.status,
          offer_accepted_bool: offer_accepted_bool !== undefined ? offer_accepted_bool : existingApp.offer_accepted_bool
        }
      });

      // 2. Automation: If offer is accepted for the first time
      if (offer_accepted_bool === true && existingApp.offer_accepted_bool === false) {
        // Automatically create a Student Profile
        const studentNum = `STU-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
        
        await tx.studentProfile.create({
          data: {
            person_id: existingApp.person_id,
            student_num: studentNum,
            status: 'ENROLLED',
            entry_term: new Date().getFullYear().toString(),
            program_id: existingApp.program_id,
          }
        });
      }

      return updatedApp;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create Application (Initial Draft)
router.post('/', async (req, res, next) => {
  try {
    const { person_id, program_id } = req.body;
    const app = await prisma.application.create({
      data: {
        person_id,
        program_id,
        status: 'DRAFT',
      }
    });
    res.status(201).json(app);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

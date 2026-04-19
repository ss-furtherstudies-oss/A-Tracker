const express = require('express');
const router = express.Router();
const prisma = require('../utils/db');
const auditLogger = require('../middleware/auditLog');

// Get all students (for data grid)
router.get('/', async (req, res, next) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        person: true,
        program: true,
      },
    });
    res.json(students);
  } catch (error) {
    next(error);
  }
});

// Create a new Student Profile (from Data Entry Form)
router.post('/', async (req, res, next) => {
  try {
    const { 
      name_en, name_zh, dob, gender, contact_info, national_id, phone,
      student_num, status, entry_term, program_id, scholarship_type, grad_year,
      igcse_score, ias_score, alevel_score, ielts_score, university_dest, program_dest
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Create person
      const person = await tx.person.create({
        data: {
          name_en, name_zh, gender, contact_info, national_id, phone,
          dob: new Date(dob),
        }
      });

      // Create profile
      const student = await tx.studentProfile.create({
        data: {
          person_id: person.id,
          student_num, status: status || 'APPLICANT', entry_term, program_id,
          scholarship_type, grad_year,
          igcse_score, ias_score, alevel_score, ielts_score, university_dest, program_dest
        },
        include: { person: true, program: true }
      });
      return student;
    });

    res.status(201).json(result);
  } catch (error) {
    // If Prisma Unique Constraint error (P2002), it goes to ErrorHandler
    next(error);
  }
});

// Update Student Profile
router.patch('/:id', auditLogger('StudentProfile'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name_en, name_zh, dob, gender, phone, contact_info,
      status, scholarship_type, grad_year, entry_term,
      igcse_score, ias_score, alevel_score, ielts_score, university_dest, program_dest
    } = req.body;

    // We must find the person_id first to update it
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { id },
      include: { person: true }
    });

    if (!existingProfile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update Person
      if (name_en || name_zh || dob || gender || phone || contact_info) {
        await tx.person.update({
          where: { id: existingProfile.person_id },
          data: { 
            name_en, name_zh, gender, phone, contact_info,
            ...(dob && { dob: new Date(dob) })
          }
        });
      }

      // Update Profile
      const profile = await tx.studentProfile.update({
        where: { id },
        data: {
          status, scholarship_type, grad_year, entry_term,
          igcse_score, ias_score, alevel_score, ielts_score, university_dest, program_dest
        },
        include: { person: true, program: true }
      });
      return profile;
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete Student
router.delete('/:id', auditLogger('StudentProfile'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.studentProfile.delete({ where: { id } });
    res.json({ success: true, message: 'Student Profile Removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../utils/db');

router.post('/generate', async (req, res, next) => {
  try {
    // 1. Create Mock Program
    const prog = await prisma.program.create({
      data: {
        code: 'CS101', name: 'Computer Science', level: 'Undergrad', department: 'Engineering', duration: 4
      }
    });

    // 2. Create Mock Students
    const mockStudents = [
      { name_en: 'Alice Chen', name_zh: '陳愛麗', status: 'ENROLLED', grad_year: 2026, ig: 'A*A*A', ielts:'8.0', acc: true, ach: 'HKSES' },
      { name_en: 'Bob Smith', name_zh: '', status: 'APPLICANT', grad_year: null, ig: 'AAB', ielts:'7.0', acc: false, ach: 'NONE' },
      { name_en: 'Charlie Wong', name_zh: '王查理', status: 'GRADUATED', grad_year: 2025, ig: 'A*AA', ielts:'7.5', acc: true, ach: 'WIRA' }
    ];

    for (let i = 0; i < mockStudents.length; i++) {
      const s = mockStudents[i];
      const person = await prisma.person.create({
        data: {
          name_en: s.name_en, name_zh: s.name_zh, gender: 'OTHER',
          dob: new Date(), national_id: `NID-${Date.now()}-${i}`
        }
      });
      await prisma.studentProfile.create({
        data: {
          person_id: person.id,
          student_num: `STU-${Date.now()}-${i}`,
          status: s.status, entry_term: '2022', program_id: prog.id,
          scholarship_type: s.ach, grad_year: s.grad_year,
          igcse_score: s.ig, ielts_score: s.ielts, university_dest: 'Oxford'
        }
      });
      
      const app = await prisma.application.create({
        data: {
          person_id: person.id, program_id: prog.id, status: s.acc ? 'ACCEPTED' : 'DRAFT', offer_accepted_bool: s.acc
        }
      });
    }

    res.json({ message: 'Dummy data generated successfully!' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

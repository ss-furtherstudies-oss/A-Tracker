const express = require('express');
const router = express.Router();
const prisma = require('../utils/db');

// Funnel logic: Total applicants -> Offeres -> Enrolled
router.get('/admissions', async (req, res, next) => {
  try {
    const totalApplicants = await prisma.application.count();
    const totalOffers = await prisma.application.count({
      where: { OR: [{ status: 'ACCEPTED' }, { offer_accepted_bool: true }] }
    });
    const enrolled = await prisma.studentProfile.count({
      where: { status: 'ENROLLED' }
    });

    const funnelData = [
      { step: 'Applicants', count: totalApplicants },
      { step: 'Admits', count: totalOffers },
      { step: 'Enrolled', count: enrolled }
    ];

    res.json(funnelData);
  } catch (error) {
    next(error);
  }
});

// Program Distribution (Metric logic)
router.get('/programs', async (req, res, next) => {
  try {
    const students = await prisma.studentProfile.groupBy({
      by: ['program_id'],
      _count: { program_id: true }
    });

    // We fetch program names to construct chart payload
    const programs = await prisma.program.findMany();
    
    const chartData = students.map(st => {
      const pName = programs.find(p => p.id === st.program_id)?.name || 'Unknown';
      return { program: pName, count: st._count.program_id };
    });

    res.json(chartData);
  } catch (error) {
    next(error);
  }
});

// Metrics overview: Current, Graduated, Total
router.get('/overview', async (req, res, next) => {
  try {
    const total = await prisma.studentProfile.count();
    const current = await prisma.studentProfile.count({ where: { status: 'ENROLLED' }});
    const graduated = await prisma.studentProfile.count({ where: { status: 'GRADUATED' }});

    res.json({ current, graduated, total });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

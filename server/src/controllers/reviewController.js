const prisma = require('../prisma');

async function createReview(req, res) {
  try {
    const { providerId, rating, comment } = req.body;

    if (!providerId || !rating || !comment) {
      return res.status(400).json({ error: 'Provider, rating and comment are required.' });
    }

    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const provider = await prisma.providerProfile.findUnique({ where: { id: parseInt(providerId, 10) } });
    if (!provider) return res.status(404).json({ error: 'Provider not found.' });

    const existing = await prisma.review.findFirst({
      where: { customerId: req.user.id, providerId: parseInt(providerId, 10) }
    });
    if (existing) return res.status(400).json({ error: 'You have already reviewed this provider.' });

    const review = await prisma.review.create({
      data: {
        customerId: req.user.id,
        providerId: parseInt(providerId, 10),
        rating: ratingNum,
        comment
      },
      include: { customer: { select: { name: true } } }
    });

    res.status(201).json({ message: 'Review submitted!', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
}

module.exports = { createReview };
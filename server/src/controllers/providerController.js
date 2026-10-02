const prisma = require('../prisma');

async function getAllProviders(req, res) {
  try {
    const { search, category, city } = req.query;

    const where = {};

    if (city) {
      where.city = { contains: city };
    }

    if (category) {
      where.services = {
        some: {
          category: {
            name: { equals: category }
          }
        }
      };
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { user: { name: { contains: search } } },
        { bio: { contains: search } },
        {
          services: {
            some: {
              title: { contains: search }
            }
          }
        }
      ];
    }

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        services: {
          include: {
            category: true
          }
        },
        reviews: true
      },
      orderBy: { experience: 'desc' }
    });

    // Calculate rating statistics
    const formattedProviders = providers.map((p) => {
      const totalRatings = p.reviews.reduce((acc, curr) => acc + curr.rating, 0);
      const avgRating = p.reviews.length > 0 ? (totalRatings / p.reviews.length).toFixed(1) : '5.0';

      return {
        id: p.id,
        userId: p.userId,
        businessName: p.businessName,
        bio: p.bio,
        experience: p.experience,
        hourlyRate: p.hourlyRate,
        serviceArea: p.serviceArea,
        city: p.city,
        isVerified: p.isVerified,
        user: p.user,
        services: p.services,
        rating: parseFloat(avgRating),
        reviewCount: p.reviews.length
      };
    });

    res.json({ providers: formattedProviders });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers.' });
  }
}

async function getProviderById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid provider ID.' });
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        services: {
          include: {
            category: true
          }
        },
        reviews: {
          include: {
            customer: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    const totalRatings = provider.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = provider.reviews.length > 0 ? (totalRatings / provider.reviews.length).toFixed(1) : '5.0';

    res.json({
      provider: {
        ...provider,
        rating: parseFloat(avgRating),
        reviewCount: provider.reviews.length
      }
    });
  } catch (error) {
    console.error('Error fetching provider detail:', error);
    res.status(500).json({ error: 'Failed to fetch provider detail.' });
  }
}

async function toggleVerifyProvider(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access restricted to administrators.' });
    }
    const id = parseInt(req.params.id, 10);
    const provider = await prisma.providerProfile.findUnique({ where: { id } });
    if (!provider) return res.status(404).json({ error: 'Provider not found.' });

    const updated = await prisma.providerProfile.update({
      where: { id },
      data: { isVerified: !provider.isVerified }
    });

    res.json({ message: 'Provider status updated', provider: updated });
  } catch (error) {
    console.error('Error verifying provider:', error);
    res.status(500).json({ error: 'Failed to update provider status.' });
  }
}

module.exports = {
  getAllProviders,
  getProviderById,
  toggleVerifyProvider
};
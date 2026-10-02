const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Local Service Finder database...');

  // Clean existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Categories
  const categoriesData = [
    {
      name: 'Plumbing',
      icon: 'bi-wrench-adjustable',
      description: 'Leaky faucets, pipe installations, drain cleaning, and bathroom fixtures.'
    },
    {
      name: 'Electrician',
      icon: 'bi-lightning-charge',
      description: 'Wiring, short circuits, switchboard installations, and inverter servicing.'
    },
    {
      name: 'Home Cleaning',
      icon: 'bi-stars',
      description: 'Full home deep cleaning, kitchen sanitation, bathroom cleaning, and sofa shampooing.'
    },
    {
      name: 'Carpentry',
      icon: 'bi-hammer',
      description: 'Furniture repair, custom woodwork, modular kitchen fittings, and door locks.'
    },
    {
      name: 'Painting',
      icon: 'bi-paint-bucket',
      description: 'Interior & exterior wall painting, waterproof coating, and texture designs.'
    },
    {
      name: 'Appliance Repair',
      icon: 'bi-tv',
      description: 'AC servicing, refrigerator repair, washing machine fixing, and microwave servicing.'
    }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.name] = created;
  }
  console.log('✔ Categories seeded:', Object.keys(categories).length);

  // Common password hash for test users
  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 2. Seed Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@localservice.com',
      password: adminPassword,
      phone: '9876500000',
      role: 'admin'
    }
  });
  console.log('✔ Admin user created:', admin.email);

  // 3. Seed Customers
  const customer1 = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      password: defaultPassword,
      phone: '9876511111',
      role: 'customer'
    }
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      password: defaultPassword,
      phone: '9876522222',
      role: 'customer'
    }
  });

  const customer3 = await prisma.user.create({
    data: {
      name: 'Arjun Nair',
      email: 'arjun.nair@example.com',
      password: defaultPassword,
      phone: '9876533333',
      role: 'customer'
    }
  });
  console.log('✔ Customer users created: 3');

  // 4. Seed Providers + Profiles + Services
  // Provider 1: Plumber
  const userPlumber = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      email: 'amit.plumber@example.com',
      password: defaultPassword,
      phone: '9876544441',
      role: 'provider',
      providerProfile: {
        create: {
          businessName: 'Amit Express Plumbing',
          bio: 'Over 8 years of hands-on plumbing expertise handling residential pipelines and emergency leak repairs in Mumbai.',
          experience: 8,
          hourlyRate: 350,
          serviceArea: 'Andheri, Jogeshwari, Vile Parle',
          city: 'Mumbai',
          isVerified: true,
          services: {
            create: [
              {
                title: 'Tap & Pipe Leak Repair',
                description: 'Inspection and rapid fix for kitchen sinks, bathroom faucets, and leaking joints.',
                price: 350,
                categoryId: categories['Plumbing'].id
              },
              {
                title: 'Water Heater / Geyser Installation',
                description: 'Safe connection and mounting of instant or storage geysers with inlet/outlet check.',
                price: 600,
                categoryId: categories['Plumbing'].id
              },
              {
                title: 'Bathroom Pipeline Renovation',
                description: 'Complete overhaul and fitting of concealed water lines and drainage.',
                price: 1500,
                categoryId: categories['Plumbing'].id
              }
            ]
          }
        }
      }
    },
    include: {
      providerProfile: {
        include: { services: true }
      }
    }
  });

  // Provider 2: Electrician
  const userElectrician = await prisma.user.create({
    data: {
      name: 'Vikram Singh',
      email: 'vikram.electrician@example.com',
      password: defaultPassword,
      phone: '9876544442',
      role: 'provider',
      providerProfile: {
        create: {
          businessName: 'Singh Power & Electricals',
          bio: 'Licensed electrician with 6 years experience in troubleshooting short circuits, wiring, and appliance setups.',
          experience: 6,
          hourlyRate: 400,
          serviceArea: 'Bandra, Khar, Santacruz',
          city: 'Mumbai',
          isVerified: true,
          services: {
            create: [
              {
                title: 'Short Circuit & MCB Trip Repair',
                description: 'Diagnose electrical shorts, isolate faulty wires, and replace trip switches.',
                price: 450,
                categoryId: categories['Electrician'].id
              },
              {
                title: 'Ceiling Fan & Light Fixture Setup',
                description: 'Assembly and secure mounting of fans, chandeliers, and decorative LED spotlights.',
                price: 300,
                categoryId: categories['Electrician'].id
              },
              {
                title: 'Complete House Wiring Inspection',
                description: 'Thorough safety audit of all home sockets, earthing lines, and circuit boxes.',
                price: 1200,
                categoryId: categories['Electrician'].id
              }
            ]
          }
        }
      }
    },
    include: {
      providerProfile: {
        include: { services: true }
      }
    }
  });

  // Provider 3: Cleaning
  const userCleaning = await prisma.user.create({
    data: {
      name: 'Anita Desai',
      email: 'anita.cleaning@example.com',
      password: defaultPassword,
      phone: '9876544443',
      role: 'provider',
      providerProfile: {
        create: {
          businessName: 'SparkleClean Home Services',
          bio: 'Dedicated deep cleaning crew with eco-friendly disinfectants and heavy-duty scrubbing equipment.',
          experience: 5,
          hourlyRate: 500,
          serviceArea: 'Borivali, Kandivali, Malad',
          city: 'Mumbai',
          isVerified: true,
          services: {
            create: [
              {
                title: 'Full 1BHK / 2BHK Deep Cleaning',
                description: 'Wall-to-wall scrubbing, floor buffing, window pane washing, and sanitization.',
                price: 1999,
                categoryId: categories['Home Cleaning'].id
              },
              {
                title: 'Kitchen Deep Scrub & Degreasing',
                description: 'Intensive removal of oil stains from chimneys, slabs, tiles, and cabinets.',
                price: 799,
                categoryId: categories['Home Cleaning'].id
              },
              {
                title: 'Bathroom Disinfection & Tile Cleaning',
                description: 'Hard water stain removal, scale cleanup, and germ protection treatment.',
                price: 499,
                categoryId: categories['Home Cleaning'].id
              }
            ]
          }
        }
      }
    },
    include: {
      providerProfile: {
        include: { services: true }
      }
    }
  });

  // Provider 4: Carpentry
  const userCarpentry = await prisma.user.create({
    data: {
      name: 'Suresh Mistri',
      email: 'suresh.carpentry@example.com',
      password: defaultPassword,
      phone: '9876544444',
      role: 'provider',
      providerProfile: {
        create: {
          businessName: 'Mastercraft Wooden Works',
          bio: 'Master carpenter specializing in fine wood finishing, door locks, hinges, and modular furniture assembly.',
          experience: 10,
          hourlyRate: 450,
          serviceArea: 'Dadar, Kurla, Chembur',
          city: 'Mumbai',
          isVerified: true,
          services: {
            create: [
              {
                title: 'Door Lock & Handle Fitting',
                description: 'Installation of high-security mortise locks, handles, and door closers.',
                price: 350,
                categoryId: categories['Carpentry'].id
              },
              {
                title: 'Furniture Assembly & Repair',
                description: 'Bed frame alignment, table stabilization, wardrobe hinge repairs.',
                price: 550,
                categoryId: categories['Carpentry'].id
              },
              {
                title: 'Custom Cupboard Woodwork',
                description: 'Custom shelving, laminate pasting, and modular wardrobe partition work.',
                price: 2500,
                categoryId: categories['Carpentry'].id
              }
            ]
          }
        }
      }
    },
    include: {
      providerProfile: {
        include: { services: true }
      }
    }
  });

  console.log('✔ Service providers & profiles created: 4');

  // 5. Seed Sample Bookings
  const plumberService = userPlumber.providerProfile.services[0];
  const cleanerService = userCleaning.providerProfile.services[1];
  const electricianService = userElectrician.providerProfile.services[0];

  const booking1 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      serviceId: plumberService.id,
      bookingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      address: 'Flat 402, Sunshine Heights, Andheri West, Mumbai',
      status: 'completed',
      totalAmount: plumberService.price,
      notes: 'Kitchen sink pipe was dripping continuously.'
    }
  });

  const booking2 = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      serviceId: cleanerService.id,
      bookingDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      address: 'B-12, Green Acres, Borivali West, Mumbai',
      status: 'completed',
      totalAmount: cleanerService.price,
      notes: 'Required kitchen deep clean before festival.'
    }
  });

  const booking3 = await prisma.booking.create({
    data: {
      customerId: customer3.id,
      serviceId: electricianService.id,
      bookingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      address: 'Plot 77, Bandra West, Mumbai',
      status: 'accepted',
      totalAmount: electricianService.price,
      notes: 'Main MCB switch keeps tripping when AC is switched on.'
    }
  });
  console.log('✔ Sample bookings created: 3');

  // 6. Seed Sample Reviews
  await prisma.review.create({
    data: {
      customerId: customer1.id,
      providerId: userPlumber.providerProfile.id,
      rating: 5,
      comment: 'Prompt response and fixed the kitchen pipe leak cleanly. Very polite and affordable.'
    }
  });

  await prisma.review.create({
    data: {
      customerId: customer2.id,
      providerId: userCleaning.providerProfile.id,
      rating: 5,
      comment: 'Amazing deep cleaning! The kitchen tiles and exhaust look brand new. Highly recommended.'
    }
  });

  await prisma.review.create({
    data: {
      customerId: customer3.id,
      providerId: userElectrician.providerProfile.id,
      rating: 4,
      comment: 'Good work fixing our tripping circuit breaker. Arrived within 30 minutes.'
    }
  });
  console.log('✔ Sample reviews created: 3');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
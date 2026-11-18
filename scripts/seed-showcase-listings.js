const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const showcaseListings = [
  {
    title: "Sabyasachi Heritage Crimson Velvet Bridal Lehenga",
    description: "Masterpiece Sabyasachi bridal lehenga handcrafted in deep crimson micro-velvet. Features intricate antique zardozi, Kashmiri tilla work, and dabka embroidery paired with dual organza dupattas. Hand-dyed pure silk blouse with sweetheart neckline.",
    category: "Lehenga",
    occasion: "Wedding",
    gender: "Women",
    listing_type: "Rental",
    size: "M",
    condition: "Pristine",
    rental_price_per_day: 4200,
    security_deposit: 12000,
    retail_price: 320000,
    image_url: "/assets/hero-lehenga.jpg",
    photo_urls: [
      "/assets/hero-lehenga.jpg",
      "/videos/runway-lehenga.mp4",
      "/assets/item-bridal.jpg",
      "/collections/wedding.png"
    ],
    city: "Bengaluru",
    area: "Indiranagar",
    pincode: "560038",
    available: true
  },
  {
    title: "Tarun Tahiliani Hand-Embroidered Chikankari Gown",
    description: "Couture ivory and rose-gold fusion evening gown featuring signature Tarun Tahiliani draped sheer georgette and tone-on-tone French knot Chikankari, highlighted with Swarovski crystals and delicate pearl tassels.",
    category: "Gown",
    occasion: "Reception",
    gender: "Women",
    listing_type: "Rental",
    size: "S",
    condition: "Pristine",
    rental_price_per_day: 3200,
    security_deposit: 8500,
    retail_price: 195000,
    image_url: "/assets/item-cocktail.jpg",
    photo_urls: [
      "/assets/item-cocktail.jpg",
      "/videos/runway-gown.mp4",
      "/collections/party.png",
      "/assets/community.jpg"
    ],
    city: "Bengaluru",
    area: "Lavelle Road",
    pincode: "560001",
    available: true
  },
  {
    title: "Manish Malhotra Imperial Navy Velvet Sherwani",
    description: "Regal bespoke Manish Malhotra royal navy velvet sherwani set. Embellished with resham threadwork, antique gold bullion wire, and mother-of-pearl buttons. Includes matching raw-silk churidar and embroidered pashmina stole.",
    category: "Sherwani",
    occasion: "Wedding",
    gender: "Men",
    listing_type: "Rental",
    size: "L",
    condition: "Pristine",
    rental_price_per_day: 3800,
    security_deposit: 10000,
    retail_price: 245000,
    image_url: "/assets/item-sherwani.jpg",
    photo_urls: [
      "/assets/item-sherwani.jpg",
      "/videos/runway-sherwani.mp4",
      "/assets/item-kurta.jpg",
      "/collections/formal.png"
    ],
    city: "Bengaluru",
    area: "Sadashivnagar",
    pincode: "560080",
    available: true
  },
  {
    title: "Raw Mango Varanasi Gold Brocade Saree",
    description: "Authentic handwoven Varanasi tissue silk saree from Raw Mango. Features kadwa weave floral jaal in pure gold and silver zari across an iridescent peacock-green warp. Comes with unstitched brocade blouse fabric.",
    category: "Saree",
    occasion: "Traditional",
    gender: "Women",
    listing_type: "Rental",
    size: "Free",
    condition: "Pristine",
    rental_price_per_day: 2600,
    security_deposit: 6500,
    retail_price: 140000,
    image_url: "/assets/item-saree.jpg",
    photo_urls: [
      "/assets/item-saree.jpg",
      "/videos/runway-saree.mp4",
      "/assets/item-anarkali.jpg",
      "/collections/traditional.png"
    ],
    city: "Bengaluru",
    area: "Koramangala",
    pincode: "560034",
    available: true
  }
];

async function seed() {
  console.log("Fetching owner user...");
  const { data: users, error: uErr } = await supabase.from('users').select('id, name').limit(1);
  if (uErr || !users?.length) {
    console.error("Could not find a valid user:", uErr);
    return;
  }
  const ownerId = users[0].id;
  console.log(`Using owner: ${users[0].name} (${ownerId})`);

  for (const item of showcaseListings) {
    // Check if listing with this title already exists
    const { data: existing } = await supabase.from('listings').select('id').eq('title', item.title).maybeSingle();
    
    if (existing) {
      console.log(`Updating existing listing: ${item.title}`);
      const { error: upErr } = await supabase.from('listings').update({
        ...item,
        owner_id: ownerId,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
      if (upErr) console.error("Error updating:", upErr);
      else console.log(`✓ Updated ${item.title}`);
    } else {
      console.log(`Inserting new listing: ${item.title}`);
      const { error: insErr } = await supabase.from('listings').insert({
        ...item,
        owner_id: ownerId
      });
      if (insErr) console.error("Error inserting:", insErr);
      else console.log(`✓ Inserted ${item.title}`);
    }
  }

  // Also enrich the existing 15 items to have multi-photo galleries
  const { data: allListings } = await supabase.from('listings').select('id, title, category, image_url, photo_urls');
  for (const l of allListings || []) {
    if (!l.photo_urls || l.photo_urls.length <= 1) {
      const photos = [l.image_url];
      if (l.category === 'Blazer') {
        photos.push('/collections/formal.png', '/assets/item-sherwani.jpg');
      } else if (l.category === 'Anarkali') {
        photos.push('/assets/item-bridal.jpg', '/collections/traditional.png');
      } else if (l.category === 'Kurta') {
        photos.push('/collections/wedding.png', '/assets/hero-lehenga.jpg');
      } else if (l.category === 'Accessories') {
        photos.push('/collections/party.png');
      } else {
        photos.push('/collections/traditional.png');
      }
      await supabase.from('listings').update({ photo_urls: photos }).eq('id', l.id);
      console.log(`Enriched gallery for: ${l.title}`);
    }
  }

  console.log("Seeding complete!");
}

seed();

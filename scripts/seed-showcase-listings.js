const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const genuineListings = [
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
    photo_urls: ["/assets/hero-lehenga.jpg"],
    city: "Bengaluru",
    area: "Indiranagar",
    pincode: "560038",
    available: true
  },
  {
    title: "Tarun Tahiliani Hand-Embroidered Evening Cocktail Gown",
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
    photo_urls: ["/assets/item-cocktail.jpg"],
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
    photo_urls: ["/assets/item-sherwani.jpg"],
    city: "Bengaluru",
    area: "Sadashivnagar",
    pincode: "560080",
    available: true
  },
  {
    title: "Raw Mango Varanasi Gold Brocade Silk Saree",
    description: "Authentic handwoven Varanasi tissue silk saree from Raw Mango. Features kadwa weave floral jaal in pure gold and silver zari across an iridescent peacock-green warp. Includes matched hand-woven raw silk blouse piece.",
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
    photo_urls: ["/assets/item-saree.jpg"],
    city: "Bengaluru",
    area: "Koramangala",
    pincode: "560034",
    available: true
  },
  {
    title: "Anita Dongre Forest Green Silk Kurta & Bandhgala Set",
    description: "Artisanal forest green Chanderi silk kurta with embroidered Nehru jacket Bandhgala. Detailed with delicate marodi thread embroidery and antique brass crest buttons. Perfect for Sangeet and Mehendi celebrations.",
    category: "Kurta",
    occasion: "Sangeet",
    gender: "Men",
    listing_type: "Rental",
    size: "M",
    condition: "Pristine",
    rental_price_per_day: 1800,
    security_deposit: 4500,
    retail_price: 68000,
    image_url: "/assets/item-kurta.jpg",
    photo_urls: ["/assets/item-kurta.jpg"],
    city: "Bengaluru",
    area: "HSR Layout",
    pincode: "560102",
    available: true
  },
  {
    title: "Abhinav Mishra Mirror-Work Ivory & Gold Bridal Anarkali",
    description: "Opulent ivory georgette floor-length bridal Anarkali adorned with Abhinav Mishra's signature raw-edge mirror work, gota patti borders, and delicate sequin spraying. Includes matching silk churidar and heavy net dupatta.",
    category: "Anarkali",
    occasion: "Wedding",
    gender: "Women",
    listing_type: "Rental",
    size: "M",
    condition: "Pristine",
    rental_price_per_day: 2400,
    security_deposit: 6000,
    retail_price: 125000,
    image_url: "/assets/item-bridal.jpg",
    photo_urls: ["/assets/item-bridal.jpg"],
    city: "Bengaluru",
    area: "Indiranagar",
    pincode: "560038",
    available: true
  },
  {
    title: "House of Chikankari Blush Rose Georgette Anarkali Set",
    description: "Delicate blush pink hand-embroidered Lucknowi Chikankari Anarkali with subtle pearl detailing and mukaish work. Paired with tonal modal churidar and scalloped chiffon dupatta for elegant day celebrations.",
    category: "Anarkali",
    occasion: "Festival",
    gender: "Women",
    listing_type: "Rental",
    size: "S",
    condition: "Pristine",
    rental_price_per_day: 1200,
    security_deposit: 3000,
    retail_price: 45000,
    image_url: "/assets/item-anarkali.jpg",
    photo_urls: ["/assets/item-anarkali.jpg"],
    city: "Bengaluru",
    area: "Jayanagar",
    pincode: "560041",
    available: true
  }
];

async function seed() {
  console.log("Connecting to Supabase...");
  const { data: users, error: uErr } = await supabase.from('users').select('id, name').limit(1);
  if (uErr || !users?.length) {
    console.error("Could not find a valid user:", uErr);
    return;
  }
  const ownerId = users[0].id;
  console.log(`Using owner: ${users[0].name} (${ownerId})`);

  // Remove any stale listings with external broken URLs or invalid media
  const { error: delErr } = await supabase
    .from('listings')
    .delete()
    .or('title.ilike.%RARE RABBIT%,image_url.ilike.%myntassets%');
  if (delErr) {
    console.warn("Delete note:", delErr.message);
  } else {
    console.log("✓ Cleaned up any external or broken listings");
  }

  // Upsert the genuine curated collection
  for (const item of genuineListings) {
    const { data: existing } = await supabase
      .from('listings')
      .select('id')
      .ilike('title', `%${item.title.split(' ')[0]}%${item.category}%`)
      .maybeSingle();

    if (existing) {
      const { error: upErr } = await supabase.from('listings').update({
        ...item,
        owner_id: ownerId
      }).eq('id', existing.id);

      if (upErr) console.error(`Error updating ${item.title}:`, upErr);
      else console.log(`✓ Updated: ${item.title} (₹${item.rental_price_per_day}/day)`);
    } else {
      const { error: insErr } = await supabase.from('listings').insert({
        ...item,
        owner_id: ownerId
      });

      if (insErr) console.error(`Error inserting ${item.title}:`, insErr);
      else console.log(`✓ Inserted: ${item.title} (₹${item.rental_price_per_day}/day)`);
    }
  }

  // Remove any leftover video files or invalid photo_urls across all listings
  const { data: allListings } = await supabase.from('listings').select('id, title, image_url, photo_urls');
  for (const l of allListings || []) {
    let cleanedUrls = (l.photo_urls || []).filter(url => 
      typeof url === 'string' && 
      !url.endsWith('.mp4') && 
      !url.includes('video') &&
      !url.includes('myntassets')
    );
    if (!cleanedUrls.length && l.image_url) {
      cleanedUrls = [l.image_url];
    }
    await supabase.from('listings').update({ photo_urls: cleanedUrls }).eq('id', l.id);
  }

  console.log("\nSeeding & verification complete!");
}

seed();

import React from 'react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="prose prose-lg max-w-none font-garamond">
        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Welcome to The Spoonbill Lounge – Redondo Beach's Premier Escape</h3>
        <p className="text-gray-600 mb-6">
          Step into a world where the spirit of the tropics meets the sophistication of modern dining. Nestled on the historic Redondo Beach waterfront, The Spoonbill is more than just a lounge—it's a destination. Our concept blends innovative Pacific Rim cuisine with an expertly crafted cocktail program, all set within a lush, transportive atmosphere.
        </p>

        <p className="text-gray-600 mb-6">
          From fresh, locally sourced seafood to artfully curated drinks, every detail is designed to immerse guests in an upscale, yet effortlessly relaxed, tropical experience. Whether you're indulging in a handcrafted cocktail at our bar, savoring a meal with breathtaking ocean views, or celebrating a special occasion, The Spoonbill offers an unforgettable escape—right in the heart of Southern California.
        </p>

        <p className="text-gray-600 mb-12">
          Welcome to your new island-inspired retreat.
        </p>

        <div className="my-12">
          <img
            src="https://raw.githubusercontent.com/CAJustise/the-spoonbill/main/public/images/library/venue/multiimage.png"
            alt="Tropical lounge interior"
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg bg-gray-100"
          />
        </div>

        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Our Story</h3>
        <p className="text-gray-600 mb-8">
          Founded in 2026, The Spoonbill Lounge was created from a deep passion for crafting exceptional dining and drinking experiences. Inspired by the vibrant energy of the Pacific Rim, we set out to build a space where immersive ambiance, bold flavors, and refined hospitality come together seamlessly.
        </p>
        <p className="text-gray-600 mb-8">
          Our name honors the roseate spoonbill, a striking and elegant bird known for its graceful presence and distinctive beauty—qualities that reflect our approach to hospitality. Just as the spoonbill thrives in tropical landscapes, we've designed our lounge to be an inviting escape, where every cocktail, dish, and detail transports guests to a world of effortless indulgence.
        </p>

        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Our Philosophy</h3>
        <p className="text-gray-600 mb-8">
          We believe in creating immersive experiences that transport you to a tropical escape, blending world-class hospitality with culinary and mixological excellence. Every dish and cocktail is thoughtfully crafted, balancing flavor, presentation, and ambiance to create an experience that feels both indulgent and effortless.
        </p>

        <div className="grid md:grid-cols-2 gap-8 my-12">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg"
          >
            <h4 className="text-xl font-display font-bold text-gray-900 mb-3">The Cuisine</h4>
            <p className="text-gray-600">
              Our menu is a celebration of Pacific Rim flavors, where traditional techniques meet modern innovation. Every dish is crafted with the freshest, high-quality ingredients, telling a story of flavor, culture, and creativity. From bright, citrus-forward ceviches to rich, smoky grilled delicacies, each plate is designed to delight the senses.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg"
          >
            <h4 className="text-xl font-display font-bold text-gray-900 mb-3">The Cocktails</h4>
            <p className="text-gray-600">
              Our bar program is a love letter to tiki culture, combining classic tropical cocktails with bold, innovative twists. Each drink is handcrafted with premium spirits, house-made syrups, and fresh tropical ingredients, ensuring a perfect balance of depth, brightness, and artistry. From timeless Mai Tais to unexpected new creations, every sip is designed to transport you.
            </p>
          </motion.div>
        </div>

        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Sustainability & Sourcing</h3>
        <p className="text-gray-600 mb-6">
          At The Spoonbill, we believe that exceptional dining starts with ethical and sustainable sourcing. Our commitment to responsible hospitality is reflected in every ingredient we use. We partner with local farmers, fisheries, and artisans within a 100-mile radius of Redondo Beach to ensure the freshest, highest-quality ingredients while supporting the local economy. We strictly adhere to the Monterey Bay Aquarium Seafood Watch guidelines for sustainable seafood and prioritize organic, Fair Trade-certified products when sourcing tropical ingredients.
        </p>
        <p className="text-gray-600 mb-8">
          Our nose-to-tail philosophy ensures minimal waste by using every part of the ingredients we source, while our seasonal menu adaptation guarantees that our dishes evolve with the freshest local produce. We also feature a sustainable beverage program, with craft spirits from eco-conscious distilleries and house-brewed beers developed in collaboration with local breweries. Beyond sourcing, we actively work to reduce waste and environmental impact through composting initiatives, energy-efficient appliances, and a commitment to eliminating single-use plastics. Our ultimate goal is to not only offer an incredible dining experience but to do so in a way that preserves the beauty and biodiversity of our planet.
        </p>

        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">What to Expect (For First-Time Visitors)</h3>
        <p className="text-gray-600 mb-6">
          Stepping into The Spoonbill is like entering a tropical sanctuary—a place where fine dining, craft mixology, and laid-back island elegance meet. Whether you're here for a romantic dinner, a lively gathering, or a quiet drink at the bar, here's what you can expect:
        </p>

        <div className="space-y-6 mb-8">
          <div>
            <h4 className="text-xl font-display font-bold text-gray-900 mb-2">A Welcoming Atmosphere</h4>
            <p className="text-gray-600">
              Our attentive staff is dedicated to making you feel at home from the moment you arrive. First-time guests are encouraged to let us know about any special occasions or dietary preferences—we're happy to personalize your experience.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-display font-bold text-gray-900 mb-2">A Unique Cocktail Program</h4>
            <p className="text-gray-600">
              Our bar showcases both classic and modern tiki-inspired cocktails, using house-infused syrups, rare rums, and hand-crafted garnishes. For the ultimate Spoonbill experience, ask about our tableside cocktail presentations.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-display font-bold text-gray-900 mb-2">Fresh, Elevated Pacific Rim Cuisine</h4>
            <p className="text-gray-600">
              Our menu blends flavors from across the Pacific with locally sourced ingredients, offering everything from fresh seafood crudos and ceviches to expertly grilled meats and plant-based delights.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-display font-bold text-gray-900 mb-2">A Commitment to Sustainability</h4>
            <p className="text-gray-600">
              Every dish and drink you enjoy is part of our mission to support responsible sourcing and minimize waste. You can even scan a QR code on our menu to learn more about our sustainability efforts.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-display font-bold text-gray-900 mb-2">A Multi-Sensory Escape</h4>
            <p className="text-gray-600">
              Beyond the food and drinks, The Spoonbill is an experience—lush greenery, warm candlelit ambiance, and carefully curated jazz, tropical, and world music playlists set the tone for an unforgettable evening.
            </p>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          Whether it's your first visit or your fiftieth, The Spoonbill Lounge is designed to transport you—one bite, one sip, and one moment at a time.
        </p>

        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Visit Us</h3>
        <p className="text-gray-600">
          Whether you're celebrating a special occasion or simply seeking an elevated escape, The Spoonbill Lounge offers an unforgettable experience. Let us transport you to a world of refined indulgence, where craft cocktails, bold flavors, and a lush tropical ambiance come together to create the ultimate getaway—right here in Redondo Beach.
        </p>
      </div>
    </div>
  );
};

export default About;

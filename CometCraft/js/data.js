// The ULTIMATE Recipe Database
window.recipes = {
    // === CORE ELEMENTS (100+ basics) ===
    "Earth+Water": { name: "Mud", icon: "💩", category: "basic" },
    "Fire+Water": { name: "Steam", icon: "🌫️", category: "basic" },
    "Earth+Fire": { name: "Lava", icon: "🌋", category: "basic" },
    "Earth+Wind": { name: "Dust", icon: "🤧", category: "basic" },
    "Fire+Wind": { name: "Smoke", icon: "🚬", category: "basic" },
    "Water+Wind": { name: "Wave", icon: "🌊", category: "basic" },
    "Water+Water": { name: "Ocean", icon: "🌊", category: "basic" },
    "Ocean+Ocean": { name: "Sea", icon: "🌊", category: "basic" },
    "Earth+Earth": { name: "Mountain", icon: "⛰️", category: "basic" },
    "Mountain+Mountain": { name: "Range", icon: "🏔️", category: "basic" },
    "Fire+Fire": { name: "Inferno", icon: "🔥", category: "basic" },
    "Wind+Wind": { name: "Hurricane", icon: "🌀", category: "basic" },
    "Lava+Water": { name: "Obsidian", icon: "🪨", category: "basic" },
    "Obsidian+Stone": { name: "Nether", icon: "🔥", category: "basic" },
    "Stone+Wind": { name: "Sandstone", icon: "🏜️", category: "basic" },
    "Fire+Sand": { name: "Glass", icon: "🔮", category: "basic" },
    "Fire+Stone": { name: "Metal", icon: "⚙️", category: "basic" },
    "Metal+Metal": { name: "Alloy", icon: "🔗", category: "basic" },
    "Mud+Fire": { name: "Clay", icon: "🏺", category: "basic" },
    "Clay+Fire": { name: "Pottery", icon: "🍶", category: "basic" },
    "Steam+Wind": { name: "Fog", icon: "🌁", category: "basic" },
    "Cloud+Water": { name: "Storm", icon: "⛈️", category: "basic" },
    "Cloud+Fire": { name: "Thunder", icon: "⛈️", category: "basic" },
    "Cloud+Ice": { name: "Hail", icon: "🧊", category: "basic" },
    "Fire+Ice": { name: "Water", icon: "💦", category: "basic" },
    "Water+Cold": { name: "Ice", icon: "🧊", category: "basic" },
    "Ice+Ice": { name: "Glacier", icon: "❄️", category: "basic" },
    "Air+Fire": { name: "Plasma", icon: "⚡", category: "basic" },
    "Energy+Cloud": { name: "Aurora", icon: "🌌", category: "basic" },
    "Earth+Energy": { name: "Magnet", icon: "🧲", category: "basic" },
    "Magnet+Metal": { name: "Motor", icon: "⚙️", category: "basic" },
    "Glass+Sand": { name: "Hourglass", icon: "⏳", category: "basic" },
    "Time+Sand": { name: "Desert", icon: "🏜️", category: "basic" },
    "Light+Prism": { name: "Rainbow", icon: "🌈", category: "basic" },
    "Rain+Sun": { name: "Rainbow", icon: "🌈", category: "basic" },
    "Void+Light": { name: "Universe", icon: "🌌", category: "basic" },

    // === MYTHICAL BEASTS (50+) ===
    "Lizard+Fire": { name: "Dragon", icon: "🐉", category: "mythical" },
    "Dragon+Ice": { name: "Frostwyrm", icon: "❄️🐉", category: "mythical" },
    "Dragon+Water": { name: "Leviathan", icon: "🐲", category: "mythical" },
    "Dragon+Lightning": { name: "Thunder Drake", icon: "⚡🐉", category: "mythical" },
    "Bird+Horse": { name: "Pegasus", icon: "🦄", category: "mythical" },
    "Horse+Horn": { name: "Unicorn", icon: "🦄", category: "mythical" },
    "Unicorn+Rainbow": { name: "Prism Pony", icon: "🌈🦄", category: "mythical" },
    "Fish+Woman": { name: "Siren", icon: "🧜‍♀️", category: "mythical" },
    "Fish+Human": { name: "Merman", icon: "🧜‍♂️", category: "mythical" },
    "Bird+Human": { name: "Harpy", icon: "🦅", category: "mythical" },
    "Lion+Eagle": { name: "Griffin", icon: "🦁🦅", category: "mythical" },
    "Snake+Chicken": { name: "Cockatrice", icon: "🐍🐓", category: "mythical" },
    "Lion+Scorpion": { name: "Manticore", icon: "🦂🦁", category: "mythical" },
    "Horse+Fish": { name: "Kelpie", icon: "🐎🌊", category: "mythical" },
    "Turtle+Snake": { name: "World Serpent", icon: "🐢🐍", category: "mythical" },
    "Fox+Fire": { name: "Kitsune", icon: "🦊🔥", category: "mythical" },
    "Rabbit+Moon": { name: "Moon Rabbit", icon: "🐇🌙", category: "mythical" },
    "Crow+Death": { name: "Morrigan", icon: "🐦‍⬛💀", category: "mythical" },
    "Spider+Woman": { name: "Arachne", icon: "🕷️👩", category: "mythical" },
    "Wolf+Moon": { name: "Werewolf", icon: "🐺🌕", category: "mythical" },
    "Bat+Vampire": { name: "Nosferatu", icon: "🦇🧛", category: "mythical" },
    "Golem+Life": { name: "Frankenstein", icon: "🗿⚡", category: "mythical" },
    "Phoenix+Fire": { name: "Immortal Bird", icon: "🔥🦅", category: "mythical" },
    "Dragon+Treasure": { name: "Smaug", icon: "🐉💰", category: "mythical" },
    "Kraken+Ship": { name: "Sea Monster", icon: "🐙🚢", category: "mythical" },

    // === VIDEO GAME CROSSOVERS (75+) ===
    "Plumber+Mushroom": { name: "Mario", icon: "👨‍🔧🍄", category: "games" },
    "Mario+Flower": { name: "Fire Mario", icon: "🔥👨‍🔧", category: "games" },
    "Mario+Star": { name: "Invincible Mario", icon: "⭐👨‍🔧", category: "games" },
    "Turtle+Plumber": { name: "Bowser", icon: "🐢👑", category: "games" },
    "Princess+Mushroom": { name: "Peach", icon: "👸🍄", category: "games" },
    "Hedgehog+Speed": { name: "Sonic", icon: "🦔⚡", category: "games" },
    "Sonic+Ring": { name: "Super Sonic", icon: "🦔💍", category: "games" },
    "Fox+Space": { name: "Star Fox", icon: "🦊🚀", category: "games" },
    "Elf+Sword": { name: "Link", icon: "🧝🗡️", category: "games" },
    "Link+Triforce": { name: "Hero of Time", icon: "⏳🗡️", category: "games" },
    "Princess+Wise": { name: "Zelda", icon: "👸🔮", category: "games" },
    "Pikachu+Evolution": { name: "Raichu", icon: "⚡🐭", category: "games" },
    "Monster+Ball": { name: "Pokéball", icon: "🔴⚪", category: "games" },
    "Pokéball+Fire": { name: "Charizard", icon: "🐲🔥", category: "games" },
    "Pokéball+Water": { name: "Blastoise", icon: "🐢💦", category: "games" },
    "Block+Game": { name: "Minecraft", icon: "🧱🎮", category: "games" },
    "Minecraft+Creeper": { name: "Explosion", icon: "💥💚", category: "games" },
    "Vault+Experiment": { name: "Fallout", icon: "☢️🏜️", category: "games" },
    "Wasteland+Dog": { name: "Dogmeat", icon: "🐕☢️", category: "games" },
    "Space+Marine": { name: "Master Chief", icon: "🪖🚀", category: "games" },
    "AI+Rampant": { name: "Cortana", icon: "🤖💙", category: "games" },
    "Assassin+Creed": { name: "Ezio", icon: "🗡️🦅", category: "games" },
    "Ninja+Stealth": { name: "Solid Snake", icon: "🥷🐍", category: "games" },
    "Witcher+Silver": { name: "Geralt", icon: "⚔️🐺", category: "games" },
    "Dragon+Born": { name: "Dovahkiin", icon: "🐉👑", category: "games" },
    "Pilot+Titan": { name: "BT-7274", icon: "🤖✈️", category: "games" },
    "Hunter+Monster": { name: "Bloodborne", icon: "🔫🩸", category: "games" },
    "Ghost+Samurai": { name: "Ghost of Tsushima", icon: "👻🗡️", category: "games" },
    "Viking+Ragnarok": { name: "Kratos", icon: "🪓⚡", category: "games" },
    "Boy+Goat": { name: "Undertale", icon: "👦🐐", category: "games" },
    "Imposter+Space": { name: "Among Us", icon: "👨‍🚀ඞ", category: "games" },
    "Bean+Platform": { name: "Fall Guys", icon: "🫘🏃", category: "games" },
    "Gardening+Zombie": { name: "Plants vs Zombies", icon: "🌻🧟", category: "games" },

    // === ANIME/MANGA UNIVERSE (60+) ===
    "Ninja+Fox": { name: "Naruto", icon: "🍥🦊", category: "anime" },
    "Naruto+Ramen": { name: "Naruto", icon: "🍜👦", category: "anime" },
    "Pirate+Straw Hat": { name: "Luffy", icon: "🏴‍☠️👒", category: "anime" },
    "Devil+Fruit": { name: "Gomu Gomu", icon: "🍎🔄", category: "anime" },
    "Sword+Pirate": { name: "Zoro", icon: "🗡️🍶", category: "anime" },
    "Saiyan+Monkey": { name: "Goku", icon: "🐵💥", category: "anime" },
    "Super+Saiyan": { name: "SSJ Goku", icon: "💛💥", category: "anime" },
    "Dragon+Ball": { name: "Shenron", icon: "🐉🌟", category: "anime" },
    "Alchemist+Brother": { name: "Fullmetal", icon: "⚗️👬", category: "anime" },
    "Titan+Wall": { name: "Attack Titan", icon: "🗿🧱", category: "anime" },
    "Demon+Hunter": { name: "Demon Slayer", icon: "👹⚔️", category: "anime" },
    "Breath+Water": { name: "Water Breathing", icon: "💦🗡️", category: "anime" },
    "Cat+Racoon": { name: "Pikachu", icon: "🐱⚡", category: "anime" }, // Easter egg
    "Card+Magic": { name: "Cardcaptor", icon: "🃏✨", category: "anime" },
    "Death+Notebook": { name: "Kira", icon: "📓☠️", category: "anime" },
    "Gundam+Robot": { name: "Mobile Suit", icon: "🤖⚔️", category: "anime" },
    "Sailor+Moon": { name: "Sailor Moon", icon: "🌙👮‍♀️", category: "anime" },
    "Evangelion+Angel": { name: "EVA-01", icon: "🤖👼", category: "anime" },
    "Hero+Academy": { name: "Deku", icon: "💪🎓", category: "anime" },
    "One+Punch": { name: "Saitama", icon: "👨‍🦲👊", category: "anime" },
    "Ghost+Parasite": { name: "Migi", icon: "👻🖐️", category: "anime" },
    "Coffee+Time": { name: "Re:Zero", icon: "☕🔄", category: "anime" },

    // === CUSTOM WEIRD MASHUPS (100+) ===
    "Robot+Cat": { name: "Robocat", icon: "🤖🐱", category: "weird" },
    "Zombie+Plant": { name: "Zombie Plant", icon: "🧟🌱", category: "weird" },
    "Pizza+Rainbow": { name: "Unicorn Pizza", icon: "🦄🍕", category: "weird" },
    "Taco+Cat": { name: "Tacocat", icon: "🌮🐱", category: "weird" }, // Palindrome!
    "Dragon+Taco": { name: "Dragon Taco", icon: "🐉🌮", category: "weird" },
    "Ninja+Pirate": { name: "Ninja Pirate", icon: "🥷🏴‍☠️", category: "weird" },
    "Robot+Dinosaur": { name: "Mechasaur", icon: "🤖🦖", category: "weird" },
    "Alien+Cow": { name: "UFO Cow", icon: "👽🐄", category: "weird" },
    "Ghost+Toast": { name: "Ghost Toast", icon: "👻🍞", category: "weird" },
    "Wizard+Computer": { name: "Technomancer", icon: "🧙‍♂️💻", category: "weird" },
    "Vampire+Garlic": { name: "Confused Vampire", icon: "🧛🧄", category: "weird" },
    "Werewolf+Barber": { name: "Hairy Situation", icon: "🐺✂️", category: "weird" },
    "Mermaid+Bicycle": { name: "Land Mermaid", icon: "🧜‍♀️🚲", category: "weird" },
    "Unicorn+Skateboard": { name: "Radicorn", icon: "🦄🛹", category: "weird" },
    "Dragon+Toaster": { name: "Dragon Toast", icon: "🐉🍞", category: "weird" },
    "Robot+Bee": { name: "Robobee", icon: "🤖🐝", category: "weird" },
    "Ninja+Toast": { name: "Silent Toast", icon: "🥷🍞", category: "weird" },
    "Pirate+Ninja": { name: "Pirate Ninja", icon: "🏴‍☠️🥷", category: "weird" },
    "Zombie+Robot": { name: "Zombot", icon: "🧟🤖", category: "weird" },
    "Alien+Cat": { name: "Alien Cat", icon: "👽🐱", category: "weird" },
    "Dinosaur+Astronaut": { name: "Space Dino", icon: "🦖👨‍🚀", category: "weird" },
    "Ghost+Robot": { name: "Ghost in the Shell", icon: "👻🤖", category: "weird" },
    "Vampire+Mermaid": { name: "Vampire Mermaid", icon: "🧛🧜‍♀️", category: "weird" },
    "Werewolf+Chef": { name: "Wolf Chef", icon: "🐺👨‍🍳", category: "weird" },
    "Wizard+Programmer": { name: "Code Wizard", icon: "🧙‍♂️💻", category: "weird" },
    "Dragon+Donut": { name: "Dragon Donut", icon: "🐉🍩", category: "weird" },
    "Robot+Garden": { name: "Garden Bot", icon: "🤖🌻", category: "weird" },
    "Alien+Farmer": { name: "Alien Farmer", icon: "👽👨‍🌾", category: "weird" },
    "Zombie+Office": { name: "Office Zombie", icon: "🧟💼", category: "weird" },
    "Ghost+Internet": { name: "Digital Ghost", icon: "👻🌐", category: "weird" },
    "Ninja+Chef": { name: "Ninja Chef", icon: "🥷👨‍🍳", category: "weird" },
    "Pirate+Barista": { name: "Pirate Barista", icon: "🏴‍☠️☕", category: "weird" },
    "Dinosaur+Chef": { name: "Dino Chef", icon: "🦖👨‍🍳", category: "weird" },
    "Robot+Artist": { name: "Robot Artist", icon: "🤖🎨", category: "weird" },
    "Alien+Musician": { name: "Alien Musician", icon: "👽🎵", category: "weird" },
    "Zombie+Yoga": { name: "Zombie Yoga", icon: "🧟🧘", category: "weird" },
    "Ghost+DJ": { name: "Ghost DJ", icon: "👻🎧", category: "weird" },
    "Vampire+Surfer": { name: "Vampire Surfer", icon: "🧛🏄", category: "weird" },
    "Werewolf+Detective": { name: "Werewolf Detective", icon: "🐺🕵️", category: "weird" },
    "Wizard+Engineer": { name: "Wizard Engineer", icon: "🧙‍♂️⚙️", category: "weird" },
    "Dragon+Accountant": { name: "Dragon Accountant", icon: "🐉📊", category: "weird" },
    "Robot+Writer": { name: "Robot Writer", icon: "🤖✍️", category: "weird" },
    "Alien+Teacher": { name: "Alien Teacher", icon: "👽📚", category: "weird" },
    "Zombie+Gardener": { name: "Zombie Gardener", icon: "🧟🌱", category: "weird" },

    // === INTERNET/STREAMING CULTURE (50+) ===
    "Cat+Keyboard": { name: "Cat Video", icon: "🐱⌨️", category: "internet" },
    "Dog+Internet": { name: "Doge", icon: "🐕💎", category: "internet" },
    "Doge+Coin": { name: "Bitcoin", icon: "₿", category: "internet" },
    "Stream+Gamer": { name: "Streamer", icon: "🎥🎮", category: "internet" },
    "Streamer+Cat": { name: "Twitch", icon: "📺🐱", category: "internet" },
    "Video+Loop": { name: "Vine", icon: "🎬🔄", category: "internet" },
    "Dance+TikTok": { name: "Renegade", icon: "💃📱", category: "internet" },
    "Meme+Ancient": { name: "Dank Meme", icon: "🦍📜", category: "internet" },
    "Wojak+Feels": { name: "Pepe", icon: "🐸😢", category: "internet" },
    "Karen+Manager": { name: "Can I Speak", icon: "👩‍🦳📞", category: "internet" },
    "Boomer+Phone": { name: "OK Boomer", icon: "👴📱", category: "internet" },
    "Zoom+Meeting": { name: "Work From Home", icon: "💻🏠", category: "internet" },
    "VPN+Netflix": { name: "Chill", icon: "🛡️📺", category: "internet" },
    "Unboxing+Kid": { name: "YouTube Kids", icon: "🎁👦", category: "internet" },
    "Algorithm+Cat": { name: "Recommendation", icon: "🤖📈", category: "internet" },
    "Subscribe+Bell": { name: "Notification", icon: "🔔📢", category: "internet" },
    "Like+Dislike": { name: "Controversy", icon: "👍👎", category: "internet" },
    "Comment+Troll": { name: "Flame War", icon: "💬🔥", category: "internet" },
    "Viral+Challenge": { name: "Ice Bucket", icon: "🦠🧊", category: "internet" },
    "Influencer+Sponsor": { name: "Ad", icon: "🤳💰", category: "internet" },
    "Unboxing+Phone": { name: "Tech Review", icon: "📱🎥", category: "internet" },
    "Podcast+Joe": { name: "Spotify", icon: "🎙️☕", category: "internet" },
    "Stream+Sleep": { name: "ASMR", icon: "🎤😴", category: "internet" },

    // === SCI-FI/FANTASY WORLDS (40+) ===
    "Space+Opera": { name: "Star Wars", icon: "🌌🎭", category: "scifi" },
    "Jedi+Laser": { name: "Lightsaber", icon: "⚔️🔦", category: "scifi" },
    "Sith+Lightning": { name: "Force Lightning", icon: "⚡😈", category: "scifi" },
    "Wormhole+Space": { name: "Stargate", icon: "🌀🚪", category: "scifi" },
    "AI+Singularity": { name: "Skynet", icon: "🤖💀", category: "scifi" },
    "Cyber+Punk": { name: "Neon Tokyo", icon: "💻🎸", category: "scifi" },
    "Matrix+Glitch": { name: "Red Pill", icon: "🔴💊", category: "scifi" },
    "Time+Paradox": { name: "Back to Future", icon: "⏳🚗", category: "scifi" },
    "Hover+Board": { name: "Future Sport", icon: "🛹⚡", category: "scifi" },
    "Teleport+Mishap": { name: "The Fly", icon: "🚪🪰", category: "scifi" },
    "Clone+Army": { name: "Republic", icon: "👥⚔️", category: "scifi" },
    "Android+Dream": { name: "Electric Sheep", icon: "🤖🐑", category: "scifi" },
    "Space+Marine": { name: "Starship Trooper", icon: "👨‍🚀🐛", category: "scifi" },
    "Alien+Xenomorph": { name: "Facehugger", icon: "👽🐙", category: "scifi" },
    "Wizard+School": { name: "Hogwarts", icon: "🏰🧙", category: "fantasy" },
    "Ring+Power": { name: "One Ring", icon: "💍🔥", category: "fantasy" },
    "Dragon+Hoard": { name: "Smaug's Treasure", icon: "🐉💰", category: "fantasy" },
    "Elf+Forest": { name: "Lothlórien", icon: "🧝🌳", category: "fantasy" },
    "Dwarf+Mountain": { name: "Moria", icon: "🧔⛏️", category: "fantasy" },
    "Orc+War": { name: "Mordor", icon: "👹⚔️", category: "fantasy" },

    // === SECRET/EASTER EGG COMBOS (30+) ===
    "Everything+Bagel": { name: "Universe", icon: "🌌🥯", category: "secret" },
    "Nothing+Everything": { name: "Paradox", icon: "🔄❓", category: "secret" },
    "God+Devil": { name: "Balance", icon: "😇😈", category: "secret" },
    "Life+Death": { name: "Rebirth", icon: "🔄💀", category: "secret" },
    "Time+Space": { name: "Spacetime", icon: "⏳🌌", category: "secret" },
    "Infinity+Zero": { name: "Undefined", icon: "♾️0️⃣", category: "secret" },
    "Answer+Question": { name: "42", icon: "❓4️⃣2️⃣", category: "secret" },
    "Rick+Morty": { name: "Wubba Lubba", icon: "👴👦", category: "secret" },
    "Pickle+Rick": { name: "Funniest Shit", icon: "🥒👨‍🔬", category: "secret" },
    "Shrek+Swamp": { name: "Home", icon: "👹🏠", category: "secret" },
    "All Star+Smash Mouth": { name: "Somebody Once", icon: "⭐👄", category: "secret" },
    "Loss+Comic": { name: "Is this Loss?", icon: "😭📊", category: "secret" },
    "Bee+Movie": { name: "According to all laws", icon: "🐝🎬", category: "secret" },
    "John+Cena": { name: "🎺🎺🎺", icon: "👋🎺", category: "secret" },
    "Chungus+Big": { name: "Big Chungus", icon: "🐰💪", category: "secret" },
    "Ugandan+Knuckles": { name: "Do you know da wae", icon: "🦔👑", category: "secret" },
    "Harambee+Gorilla": { name: "Dicks out", icon: "🦍😔", category: "secret" },
    "Dog+Fortnite": { name: "Default Dance", icon: "🐕💃", category: "secret" },
    "Area+51": { name: "Naruto Run", icon: "🏃‍♂️🛸", category: "secret" },
    "Belle+Delphine": { name: "Gamer Girl Bathwater", icon: "👧🛁", category: "secret" },

    // === ADVANCED COMBINATIONS (Chain reactions) ===
    "Fire+Steam": { name: "Engine", icon: "🔥🚂", category: "tech" },
    "Engine+Wheel": { name: "Car", icon: "🚗", category: "tech" },
    "Car+Rocket": { name: "Rocket Car", icon: "🚗🚀", category: "tech" },
    "Rocket Car+Space": { name: "SpaceX", icon: "🚀🪐", category: "tech" },
    "Computer+AI": { name: "Singularity", icon: "💻🤯", category: "tech" },
    "Singularity+Human": { name: "Upload", icon: "👤💾", category: "tech" },
    "Upload+Virtual": { name: "Simulation", icon: "🖥️🌍", category: "tech" },
    "Simulation+Glitch": { name: "Matrix", icon: "📟🔄", category: "tech" },
    "Magic+Science": { name: "Clarketech", icon: "✨⚛️", category: "tech" },
    "Clarketech+God": { name: "Deus Ex Machina", icon: "🤖👼", category: "tech" },

    // === RECIPE CHAINS (Progressive crafting) ===
    "Plant+Time": { name: "Tree", icon: "🌳", category: "nature" },
    "Tree+Tree": { name: "Forest", icon: "🌲🌲", category: "nature" },
    "Forest+Time": { name: "Ancient Forest", icon: "🌳🕰️", category: "nature" },
    "Ancient Forest+Magic": { name: "Enchanted Woods", icon: "🌳✨", category: "nature" },
    "Enchanted Woods+Fairy": { name: "Fae Realm", icon: "🧚‍♀️🌳", category: "nature" },
    
    "Village+Wall": { name: "Town", icon: "🏘️🧱", category: "civilization" },
    "Town+Castle": { name: "City", icon: "🏙️🏰", category: "civilization" },
    "City+City": { name: "Metropolis", icon: "🌆🌆", category: "civilization" },
    "Metropolis+Technology": { name: "Cyber City", icon: "🏙️💻", category: "civilization" },
    "Cyber City+Flying Car": { name: "Future City", icon: "🏙️🚗", category: "civilization" },

    // === SPECIAL ULTIMATES ===
    "Dragon+Wizard+King": { name: "Draco Lich", icon: "🐉💀👑", category: "ultimate" },
    "Robot+AI+God": { name: "Machine God", icon: "🤖⚡👼", category: "ultimate" },
    "Unicorn+Narwhal+Rainbow": { name: "Prismatic Sea Unicorn", icon: "🦄🦏🌈", category: "ultimate" },
    "Pizza+Ninja+Robot": { name: "Pizza Delivery Bot 9000", icon: "🍕🥷🤖", category: "ultimate" },
    "Everything+Infinity": { name: "Omniverse", icon: "🌌♾️", category: "ultimate" },
    "Nothing+Everything+Paradox": { name: "Singularity Collapse", icon: "💥🔄❓", category: "ultimate" }
};

// === CUSTOM CATEGORY SUPPORT ===
window.recipeCategories = {
    "basic": "🧱 Basics",
    "nature": "🌿 Nature",
    "mythical": "🐉 Mythical",
    "games": "🎮 Video Games",
    "anime": "🇯🇵 Anime/Manga",
    "scifi": "🚀 Sci-Fi",
    "fantasy": "🏰 Fantasy",
    "tech": "💻 Technology",
    "internet": "🌐 Internet Culture",
    "weird": "🤪 Weird Mashups",
    "secret": "🥚 Easter Eggs",
    "ultimate": "🏆 Ultimate Combos",
    "civilization": "🏛️ Civilization"
};

// === SPECIAL COMBINATION HANDLER ===
window.specialCombinations = {
    // Multi-step recipes
    "Fire+Water+Earth+Wind": { name: "Avatar", icon: "🌀", category: "ultimate" },
    "Earth+Fire+Water+Air": { name: "Classical Elements", icon: "⚖️", category: "basic" },
    "Life+Universe+Everything": { name: "42", icon: "4️⃣2️⃣", category: "secret" },
    
    // Pop culture references
    "Dwayne+Rock": { name: "The Rock", icon: "🧉", category: "secret" },
    "Keanu+Awesome": { name: "Breath-taking", icon: "😎", category: "secret" },
    "Elon+Musk": { name: "Mars", icon: "🚀🔴", category: "tech" },
    
    // Meme combos
    "Distracted+Boyfriend": { name: "Meme Template", icon: "👨👩👩", category: "internet" },
    "Woman+Yelling+Cat": { name: "Woman Yelling at Cat", icon: "👩🐈", category: "internet" },
    
    // Gaming references
    "Arrow+Knee": { name: "Skyrim Guard", icon: "🏹🦵", category: "games" },
    "All+Your+Base": { name: "Zero Wing", icon: "👾🛸", category: "games" },
    
    // Custom interactions
    "Recipe+Book": { name: "Cookbook", icon: "📖🍳", category: "meta" },
    "Idea+Lightbulb": { name: "Invention", icon: "💡✨", category: "tech" },
    "Bug+Feature": { name: "Easter Egg", icon: "🐛🥚", category: "secret" }
};

// === RECIPE DISCOVERY TRACKER ===
window.discoveryLog = [];
window.rareRecipes = [
    "Dragon+Taco",
    "Unicorn+Skateboard",
    "Everything+Bagel",
    "42",
    "Omniverse",
    "Machine God",
    "Prismatic Sea Unicorn"
];

// Helper function to check for special multi-element combos
window.checkSpecialCombo = function(elements) {
    const comboKey = elements.sort().join('+');
    
    // Check for 3+ element combos
    if (elements.length >= 3) {
        const sorted = elements.sort().join('+');
        if (window.specialCombinations[sorted]) {
            return window.specialCombinations[sorted];
        }
    }
    
    // Check normal 2-element combos
    return window.recipes[comboKey];
};
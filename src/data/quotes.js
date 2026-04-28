const quotes = [
  {
    text: "An idea can be tested, whereas if you have no idea, nothing can be tested and you don't understand anything. The molecule that you make when you are getting sunburned or when you eat a lot of food is part of the same molecule that contains an endorphin or an opiate. No one has ever had a hypothesis about why the two are together.",
    author: "James D. Watson",
    greeting: "GM.!!!🙏"
  },
  {
    text: "How far you go in life depends on your being tender with the young, compassionate with the aged, sympathetic with the striving and tolerant of the weak and strong. Because someday in your life you will have been all of these.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Where there is no vision, there is no hope.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Education is the key to unlock the golden door of freedom.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Ninety-nine percent of the failures come from people who have the habit of making excuses.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Nothing is more beautiful than the loveliness of the woods before sunrise.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "When you can do the common things of life in an uncommon way, you will command the attention of the world.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "There is no short cut to achievement. Life requires thorough preparation - veneer isn't worth anything.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "It is not the style of clothes one wears, neither the kind of automobile one drives, nor the amount of money one has in the bank, that counts. These mean nothing. It is simply service that measures success.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Reading about nature is fine, but if a person walks in the woods and listens carefully, he can learn more than what is in books, for they speak with the voice of God.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Our creator is the same and never changes despite the names given Him by people here and in all parts of the world. Even if we gave Him no name at all, He would still be there, within us, waiting to give us good on this earth.",
    author: "George Washington Carver",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Begin with praise and honest appreciation.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Friends. Sisters. Mothers. Professors. When women affirm women, it unlocks our power. It gives us permission to shine brighter.",
    author: "Elaine Welteroth",
    greeting: "GM & Happy International Women's Day.!!!🙏"
  },
  {
    text: "Remember that a person's name is, to that person, the sweetest sound in any language.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "When it comes to exploring the mind in the framework of cognitive neuroscience, the maximal yield of data comes from integrating what a person experiences - the first person - with what the measurements show - the third person.",
    author: "Daniel Goleman",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Mindful meditation has been discovered to foster the ability to inhibit those very quick emotional impulses.",
    author: "Daniel Goleman",
    greeting: "GM.!!!🙏"
  },
  {
    text: "The only way to get the best of an argument is to avoid it.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Be hearty in your approbation and lavish in your praise.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Praise the slightest improvement and praise every improvement.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Make the other person feel important and do it sincerely.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Develop success from failures. Discouragement and failure are two of the surest stepping stones to success.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Most of the important things in the world have been accomplished by people who have kept on trying when there seemed to be no hope at all.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Do the thing you fear to do and keep on doing it. That is the quickest and surest way to conquer fear.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Inaction breeds doubt and fear. Action breeds confidence and courage.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "When dealing with people, remember you are not dealing with creatures of logic but creatures of emotion.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Happiness does not depend on any external conditions. It is governed by our mental attitude.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Success is getting what you want. Happiness is wanting what you get.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Our fatigue is often caused not by work but by worry, frustration, and resentment.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "If you cannot sleep, then get up and do something instead of lying there worrying. It is the worry that gets you, not the loss of sleep.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Two men looked out from prison bars; one saw the mud, the other saw the stars.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Let us not allow ourselves to be upset by small things we should despise and forget.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Do the hard jobs first. The easy jobs will take care of themselves.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "People rarely succeed unless they have fun in what they are doing.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Flaming enthusiasm, backed up by horse sense and persistence, is the quality that most frequently makes for success.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "The successful person profits from their mistakes and tries again in a different way.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Act enthusiastic and you will be enthusiastic.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Do not be afraid of enemies who attack you. Be afraid of the friends who flatter you.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "By fighting you never get enough, but by yielding you get more than you expected.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "The person who seeks all their applause from outside has their happiness in another's keeping.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Most of us have far more courage than we ever dreamed we possessed.",
    author: "Dale Carnegie",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Someone is sitting in the shade today because someone planted a tree a long time ago.",
    author: "Warren Buffett",
    greeting: "GM.!!!🙏"
  },
  {
    text: "It takes 20 years to build a reputation and five minutes to ruin it. If you think about that, you'll do things differently.",
    author: "Warren Buffett",
    greeting: "GM.!!!🙏"
  },
  {
    text: "When a management with a reputation for brilliance tackles a business with a reputation for bad economics, it is the reputation of the business that remains intact.",
    author: "Warren Buffett",
    greeting: "GM.!!!🙏"
  },
  {
    text: "Should you find yourself in a chronically leaking boat, energy devoted to changing vessels is likely to be more productive than energy devoted to patching leaks.",
    author: "Warren Buffett",
    greeting: "GM.!!!🙏"
  },
  {
    text: "We simply attempt to be fearful when others are greedy and to be greedy only when others are fearful.",
    author: "Warren Buffett",
    greeting: "GM.!!!🙏"
  },
];

export default quotes;

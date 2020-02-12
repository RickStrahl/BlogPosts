---
title: Adventures in Credit Card Processing
weblogName: West Wind Web Log
postDate: 2020-02-05T22:43:27.2720472-10:00
---
# Adventures in Credit Card Processing

I've spent the last couple of weeks off and on fighting off a number of credit card validation attacks which has been an interesting challenge to work through. On my site I run a fairly old custom-built Web store application that I've been using for nearly 20 years. There have been significant upgrades and especially the credit card processing has gone through at least 5 different providers over the years.

But in recent years the amount of attacks against credit card processing pages have gone up incrementally and the sophistication of the attacks has gotten way more intense. It's not just me either - I've watched and helped a number of other sites of colleagues and customers in recent years fight off similar attacks.

These days most people will just opt for using one of the big E-Commerce platforms like Shopify or Big Commerce etc., but if you are doing your own processing you're likely looking at some of the same issues.

This post is not meant as a solution, but as my own journal documenting some of the issues along with some mitigations that I've implemented to reduce the chance of successful attacks. Note - I say reduce not eliminate because I haven't found a way to completely eliminate the problem mainly due because I as the client processing cards don't have all the information I need **before** I send a card off to processing. 

## Credit Card Validation Attacks
If you are still processing your own credit cards - even if you're using a hosted solution - chances are that people are trying to attack that card processing. That can be through actually trying to get stuff from your site which is rare these days, but more likely trying to find a way to validate credit cards in order to determine whether cards are valid and usable.

The latter attacks are not about trying to get your products but simply to run the credit card forms to see whether a transaction succeeds or fails which tells the attacker whether the card info is valid or not.

When the attacks first happened I noticed them in my logs. I get notified for failed CC transactions on my site and one day I started seeing a massive amount of requests going through. 

### Class POST Interface Attacks
My first inclination was to block off the legacy post -> card processing which had still been available on the site as a fallback for the non-hosted, JavaScript only processing. The classic interface collects all the customer and CC data and submits it to the processor. My store hasn't used these interfaces in years and the 'official' processing in the store instead uses the processor hosted interface where all the user input of sensitive information keeps the CC data on the processor's site. This is the interface you'd see if you process cards on my site today.

However, the old legacy interface was still enabled. Although there's no longer any UI or any code that directly accesses these legacy UI capture interfaces, somehow these attackers still had the information needed to attack those now-obsolete interfaces using POST form data variables. The processing would return the same UI results as the hosted form.

This happened a few months ago, and I shut down the legacy interface completely by not accepting any form submissions of directly input CC data. That shut down the original attack.




### Huge Holes in CC Processing Services
Why does 

### Foreign Credit Cards: CC Providers don't AVS check Foreign cards!
Now, here's where it gets interesting: Cards used for any type of attack are submitted with American addresses, but are **using international credit cards**. Looking at my logs I would see the fraudulent entries and without exception every single one of them that made it to the processor comes back as an internation card.

The reason for this is that American CC processors at least will not check AVS for international cards. Apparently there's no way for the card processors to get the relevant address information to verify cardholder information (likely due to privacy standards?) so AVS for international cards are worthless.

In my card processing an AVS error is a reason to reject a card, but when using an international card the AVS code returned tends to be `unavailable` or `not provided` 

BrainTree has these AVS codes:

[BrainTree AVS Codes](https://developers.braintreepayments.com/reference/general/processor-responses/avs-cvv-responses)

BrainTree would AVS those international cards either with:

* S - AVS provided but bank doesn't participate in AVS 
* I - Postal/Street not provided

S is more common.

### No Volume Checking Or Repeat Processing
I use BrainTree for processing and when I initially ran into trouble BrainTree contacted me because of the huge volume of transactions that were processed against my site. Fair point, but at the same time this is pretty lame! Out of the thousands of cards processed, 2 made it through for authorization, but none of them were actually charged. So no customer cards were violated other than an authorization.

However, those two cards were corrupted at that point. BrainTree provides no simple way to report the fraud. 

Further when I discussed the issues with BrainTree, even though I'm using a hosted solution where **they basically do all the input validation of the card info (CC and Postal Code basically)** they want me to be the gatekeeper of the traffic. BrainTree did not catch the volume attack any better than I did at the time for all the requests that made it to (mostly failed) processing. Instead their answer was **that's all on you**.  

So here we are offloading the logistics of CC processing to an external provider, making sure the cards don't touch our server (I never see the CC numbers/codes/dates) - all I capture is name and email basically so that I can send a confirmation message. All the actionable information that happens at the card processing level, but I don't have that information so it's actually **quite difficult to mitigate** against this type of validation attack.

But CC processor being the weasels they are - **That's on you!**.

## Mitigation





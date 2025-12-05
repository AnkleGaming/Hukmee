import React, { Suspense, lazy } from "react";
import Navigation from "../component/Navigation";
import HeroSection from "../component/HeroSection";
import PromoCard from "../component/PromocardSection";
import ServicesCarousel2 from "../component/ServicesCarousel2";
import ServicesCarousel4 from "../component/ServicesCarousel4";
import BecomeWePretiffyCard from "../component/ui/becomeweprettifycard";
import SpecialForYou from "../component/ui/specialyforyou";
import Footer from "../component/Footer";
import RatingScreen from "../component/ui/ratingscreen";
import WhyUs from "../component/ui/whyus";

const LazyServicesCarousel2 = lazy(() =>
  import("../component/ServicesCarousel2")
);
// const LazyServicesCarousel4 = lazy(() =>
//   import("../component/ServicesCarousel4")
// );
const LazyBecomeWePretiffyCard = lazy(() =>
  import("../component/ui/becomeweprettifycard")
);
const LazySpecialForYou = lazy(() => import("../component/ui/specialyforyou"));

const Index = () => {
  const dummyReviews = [
    {
      ID: 1,
      Name: "Vishal Gupta",
      Rating: "4",
      Review: "Great product! The quality exceeded my expectations.",
      image:
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400",
    },
    {
      ID: 2,
      Name: "Ananya Sharma",
      Rating: "4.9",
      Review: "Absolutely loved it. Highly recommend to others!",
      image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400",
    },
    {
      ID: 3,
      Name: "Rahul Verma",
      Rating: "4.4",
      Review: "It’s decent but could be improved in packaging.",
      image:
        "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?q=80&w=400",
    },
    {
      ID: 4,
      Name: "Priya Singh",
      Rating: "4.9",
      Review: "Very useful and affordable. Will buy again.",
      image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400",
    },
    {
      ID: 5,
      Name: "Aman Yadav",
      Rating: "4.9",
      Review: "The product works exactly as advertised. Worth the price!",
      image:
        "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?q=80&w=400",
    },
    {
      ID: 6,
      Name: "Simran Kaur",
      Rating: "4.9",
      Review: "Excellent service and great product quality.",
      image:
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400",
    },
    {
      ID: 7,
      Name: "Rohit Sharma",
      Rating: "4.2",
      Review: "Superb experience! Will definitely purchase again.",
      image:
        "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=400",
    },
    {
      ID: 8,
      Name: "Sneha Patel",
      Rating: "4.9",
      Review: "Good product, packaging was also neat and clean.",
      image:
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=400",
    },
    {
      ID: 9,
      Name: "Aditya Raj",
      Rating: "5",
      Review: "Fantastic product and timely delivery. Recommended!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=400",
    },
    {
      ID: 10,
      Name: "Neha Mehta",
      Rating: "4.9",
      Review: "Very happy with my purchase. Looks premium and durable.",
      image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400",
    },
    {
      ID: 11,
      Name: "Arjun Nair",
      Rating: "4.8",
      Review: "Product performance is great and value for money.",
      image:
        "https://images.unsplash.com/photo-1583241801215-7a7c07e5d59e?q=80&w=400",
    },
    {
      ID: 12,
      Name: "Kavya Joshi",
      Rating: "4.9",
      Review: "Loved the design and usability. Great experience overall.",
      image:
        "https://images.unsplash.com/photo-1598554747430-5a7945d0b98a?q=80&w=400",
    },
    {
      ID: 13,
      Name: "Harsh Kumar",
      Rating: "4.9",
      Review: "Awesome product! The build quality is top-notch.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
    },
    {
      ID: 14,
      Name: "Isha Reddy",
      Rating: "4.9",
      Review: "Received it on time and it works perfectly fine.",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400",
    },
    {
      ID: 15,
      Name: "Nitin Singh",
      Rating: "4.9",
      Review: "Met all my expectations. Really satisfied!",
      image:
        "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?q=80&w=400",
    },
    {
      ID: 16,
      Name: "Pooja Mishra",
      Rating: "5",
      Review: "Stylish and efficient. A must-have product!",
      image:
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400",
    },
    {
      ID: 17,
      Name: "Deepak Chauhan",
      Rating: "4.8",
      Review: "Great experience overall. Customer support was helpful too.",
      image:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400",
    },
    {
      ID: 18,
      Name: "Tanya Kapoor",
      Rating: "4.9",
      Review: "The product feels premium. Totally worth it!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=400",
    },
    {
      ID: 19,
      Name: "Karan Malhotra",
      Rating: "4.7",
      Review: "Using it for a week, and it's performing great!",
      image:
        "https://images.unsplash.com/photo-1514996937319-344454492b37?q=80&w=400",
    },
    {
      ID: 20,
      Name: "Divya Chauhan",
      Rating: "4.9",
      Review: "Elegant design and smooth functionality.",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400",
    },
  ];

  return (
    <div className="min-h-screen p-[8px] ">
      <section className="relative bg-white">
        <HeroSection />
      </section>

      <section className="bg-white">
        <WhyUs />
      </section>

      <section className="bg-white">
        <PromoCard />
      </section>

      <section className="py-1 sm:py-16 bg-gray-50">
        <Suspense fallback={<div />}>
          <LazyServicesCarousel2 />
          {/* <LazyServicesCarousel4 /> */}
        </Suspense>
      </section>

      {/* Reviews Section - scrollable horizontally */}
      <section className="bg-white mb-[15px]">
        <div className="overflow-x-auto scrollbar-hide">
          <RatingScreen reviews={dummyReviews} />
        </div>
      </section>

      <section className="py-1 sm:py-16 bg-pink-50">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse" />
            }
          >
            <LazyBecomeWePretiffyCard />
          </Suspense>
        </div>
      </section>

      {/* <footer className="mt-8 bg-gray-100 z-10 md:hidden">
        <Footer />
      </footer> */}
    </div>
  );
};

export default Index;

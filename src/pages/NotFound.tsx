import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you requested could not be found. Return to AKM Care home or shop."
        robots="noindex, nofollow"
        omitCanonical
      />
      <div className="flex min-h-[60vh] items-center justify-center bg-muted">
        <div className="text-center px-4">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">This page is not available.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/" className="text-primary underline hover:text-primary/90">
              Return to Home
            </Link>
            <Link to="/shop" className="text-primary underline hover:text-primary/90">
              Browse the shop
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;

const Footer = ({ light = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={light ? "relative z-10 bg-transparent pt-2 pb-6" : ""}>
      <center>
        <hr
          className={
            light
              ? "mb-4 border-zinc-200 sm:mx-auto lg:mb-6 text-center max-w-6xl"
              : "my-3 border-gray-400 opacity-15 sm:mx-auto lg:my-6 text-center"
          }
        />
        <span
          className={
            light
              ? "block text-sm pb-2 text-zinc-500 text-center"
              : "block text-sm pb-4 text-gray-500 text-center dark:text-gray-400"
          }
        >
          © {currentYear}{" "}
          <a
            href="https://domain-kamu.vercel.app"
            className={light ? "font-medium text-zinc-700 hover:text-[#2c67ed] hover:underline transition-colors" : "hover:underline"}
          >
            Muhamad Reza™
          </a>
          . All Rights Reserved.
        </span>
      </center>
    </footer>
  );
};

export default Footer;

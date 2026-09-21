const Topbar = () => {
  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">

      {/* Left */}
      <div>
        <p className="text-xs text-gray-400 tracking-wide">
          ADMINISTRATION
        </p>

        <h2 className="text-xl font-semibold text-[#111827]">
          Dashboard
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        <div className="text-right">
          <p className="text-sm font-medium text-[#111827]">
            Administrator
          </p>

          <p className="text-xs text-gray-400">
            admin@oceanus.com
          </p>
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 bg-[#111827] text-white flex items-center justify-center text-sm">
          A
        </div>

      </div>

    </header>
  );
};

export default Topbar;
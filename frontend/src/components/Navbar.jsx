import { useState, useRef, useEffect } from 'react';

function Navbar({
  userName = '',
  onHome,
  onLogin,
  onRegister,
  onSettings,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="w-full bg-white shadow-md px-6 py-3 flex justify-between relative">
      <button
        type="button"
        onClick={() => onHome?.()}
        className="text-xl font-space-grotesk tracking-wide text-blue-900 font-bold cursor-pointer"
      >
        Task Tracker
      </button>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="text-2xl cursor-pointer px-2"
        >
          ☰
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 flex flex-col">
            {userName ? (
              <>
                <span className="px-4 py-1 font-bold">{userName}</span>
                <hr className="border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setOpen(false); onSettings?.(); }}
                  className="text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onLogout?.(); }}
                  className="text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onLogin?.(); }}
                  className="text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onRegister?.(); }}
                  className="text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  Register
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
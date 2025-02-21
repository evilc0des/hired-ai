"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, BriefcaseIcon, HomeIcon, UserIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Cog6ToothIcon } from "@heroicons/react/20/solid";
import { Transition } from "@headlessui/react";

interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: HomeIcon, 
    href: "/"
  },
  {
    name: "Profile",
    icon: UserIcon,
    href: "/profile"
  },
  {
    name: "Jobs", 
    icon: BriefcaseIcon,
    href: "/jobs"
  },
  {
    name: "Settings",
    icon: Cog6ToothIcon,
    href: "/settings"
  }
];

export default function Sidenav() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <nav className={`
      fixed left-0 top-0 h-screen bg-background border-r border-black/[.08] dark:border-white/[.145]
      transition-all duration-300 ease-in-out
      ${isExpanded ? 'w-64' : 'w-16'}
    `}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 border-b border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]"
      >
        { isExpanded ? <XMarkIcon className="w-6 h-6 dark:invert text-black" /> : <Bars3Icon className="w-6 h-6 dark:invert text-black" /> }
      </button>

      <div className="flex flex-col gap-2 p-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center gap-4 p-3 rounded-lg
              hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]
              transition-colors
            `}
          >
            <item.icon
              className="w-6 h-6 dark:invert text-gray-500 hover:text-black"
            />
            <Transition
              show={isExpanded}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <span className={`
                whitespace-nowrap font-medium
              ${isExpanded ? '' : 'hidden'}
            `}>
              {item.name}
              </span>
            </Transition>
          </Link>
        ))}
      </div>
    </nav>
  );
}

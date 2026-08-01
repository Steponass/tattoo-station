import styles from './NavButton.module.css'
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";

interface NavButtonProps {
  to: string;
  buttonText: React.ReactNode;
}

export default function NavButton(
  { to, buttonText }: NavButtonProps)
{
  return (
    <LocalizedLink
      to={to}
      className={`${styles.nav_button} chamfer chamfer-xs punch`}
      viewTransition>
      {buttonText}
    </LocalizedLink>
  )
}

import styles from './NavButton.module.css'
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";

interface NavButtonProps {
  to: string;
  buttonText: React.ReactNode;
  newTab?: boolean;
}

export default function NavButton(
  { to, buttonText, newTab }: NavButtonProps)
{
  return (
    <LocalizedLink
      to={to}
      className={`${styles.nav_button} chamfer chamfer-xs punch`}
      viewTransition
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {buttonText}
    </LocalizedLink>
  )
}

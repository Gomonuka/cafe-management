import { FiGlobe, FiChevronDown } from "react-icons/fi";
import Card from "../ui/Card";
import Select from "../ui/Select";
import "../../styles/profile.css";

export default function SettingsBlock(props: {
  language: string; setLanguage: (v: string) => void;
}) {
  return (
    <Card>
      <div className="block-title">Iestatījumi</div>

      <Select
        label="Valoda"
        leftIcon={<FiGlobe />}
        rightIcon={<FiChevronDown />}
        value={props.language}
        onChange={props.setLanguage}
        options={[
          { value: "lv", label: "Latviešu" },
          { value: "en", label: "English" },
        ]}
      />
    </Card>
  );
}

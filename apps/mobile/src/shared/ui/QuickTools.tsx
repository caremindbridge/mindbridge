import { View, Text, TouchableOpacity } from 'react-native';
import { BookOpen, Wind, Phone, Lightbulb } from 'lucide-react-native';

import { fonts, spacing } from '@/shared/lib/theme';
import { useThemeColors } from '@/shared/lib/useTheme';

interface ToolItem {
  icon: React.ElementType;
  label: string;
  bgColor: string;
  iconColor: string;
  onPress?: () => void;
}

export function QuickTools() {
  const c = useThemeColors();

  const tools: ToolItem[] = [
    { icon: BookOpen, label: 'Дневник', bgColor: c.warmBg, iconColor: c.primary },
    { icon: Wind, label: 'Дыхание', bgColor: c.greenLight, iconColor: c.green },
    { icon: Phone, label: 'SOS', bgColor: c.sosBg, iconColor: c.recordingRed },
    { icon: Lightbulb, label: 'Рефлексия', bgColor: c.purpleLight, iconColor: c.purple },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {tools.map((tool) => (
        <TouchableOpacity
          key={tool.label}
          onPress={tool.onPress}
          style={{ flex: 1, alignItems: 'center', gap: 6 }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: tool.bgColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <tool.icon size={18} color={tool.iconColor} />
          </View>
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 11,
              color: c.textSecondary,
            }}
          >
            {tool.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

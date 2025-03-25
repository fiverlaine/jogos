import React, { forwardRef } from 'react';
import ExternalLinkIconRadix from './external-link-icon-radix';
import { IconProps } from "@radix-ui/react-icons/dist/types";

const ExternalLinkIcon = forwardRef<React.ElementRef<typeof ExternalLinkIconRadix>, IconProps>(
    ({ children, color, ...props }, ref) => {
    return (
        <ExternalLinkIconRadix {...props} ref={ref} />
    );
    }
);

ExternalLinkIcon.displayName = "ExternalLinkIcon";

export default ExternalLinkIcon; 
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthRedirect: () => void;
    isGuest: boolean;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onAuthRedirect, isGuest }) => {
    return null;
};

export default UpgradeModal;

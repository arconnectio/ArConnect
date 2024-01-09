import { Text, Button } from "@arconnect/components";
import { useMemo } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { Edit02 } from "@untitled-ui/icons-react";

export default function ContactSettings({ address }: Props) {
  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage
    },
    []
  );

  // contact
  const contact = useMemo(
    () => storedContacts.find((c) => c.address === address),
    [storedContacts, address]
  );

  if (!contact) return;

  return (
    <Wrapper>
      <div>
        <Header>
          <Title>{browser.i18n.getMessage("contact_info")}</Title>
          <Edit02 />
        </Header>
        <SubTitle>Avatar</SubTitle>
        <ContactPic src={contact.profileIcon} />
        <SubTitle>Name*</SubTitle>
        <ContactInfo>{contact.name}</ContactInfo>
        <SubTitle>Arweave Account Address*</SubTitle>
        <ContactInfo>{contact.address}</ContactInfo>
        {/* {arNSAddress && (
              <SubTitle>
                ArNS Address
              </SubTitle>
              <ContactInfo>
                Arweave.ar
              </ContactInfo>
            )} */}
        <SubTitle>Notes</SubTitle>
        <ContactNotes placeholder="Type a message here..." />
      </div>
      <Footer>
        <Button small fullWidth>
          Save changes
        </Button>
        <RemoveContact small fullWidth>
          Remove contact
        </RemoveContact>
      </Footer>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RemoveContact = styled(Button)`
  background-color: #ea433580;
  color: #ea4335;
`;

const ContactPic = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 100%;
  margin-bottom: 10px;
`;

const ContactInfo = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 20px;
  font-weight: 500;
  display: flex;
  flex-wrap: wrap;
`;

const ContactNotes = styled.textarea`
  display: flex;
  width: 96%;
  height: 269px;
  border-radius: 15px;
  border: 1.5px solid #ab9aff26;
  padding: 12px;
  background-color: #ab9aff26;
  ::placeholder {
    color: #b9b9b9;
    font-size: 16px;
  }
  &:focus {
    outline: none;
  }
  caret-color: #b9b9b9;
  color: #b9b9b9;
`;

const SubTitle = styled(Text)`
  font-size: 16px;
  color: #aeadcd;
  margin-bottom: 4px;
`;

const Title = styled(Text).attrs({
  title: true
})`
  font-weight: 600;
  margin-bottom: 10px;
`;

interface Props {
  address: string;
}

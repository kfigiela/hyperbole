module HelloWorld where

import Data.Text (Text)
import Web.Hyperbole



main :: IO ()
main = do
  run 3000 $ do
    liveApp (basicDocument "Example") (page messagePage')


messagePage :: (Hyperbole :> es) => Page es Response
messagePage = do
  load $ do
    pure $ do
      el bold "Message Page"
      messageView "Hello World"


messageView :: Text -> View c ()
messageView m = do
  el_ "Message:"
  el_ (text m)


data Message = Message
  deriving (Generic, Param)


data MessageAction = SetMessage Text
  deriving (Generic, Param)


instance HyperView Message where
  type Action Message = MessageAction


message :: Message -> MessageAction -> Eff es (View Message ())
message _ (SetMessage m) = do
  -- side effects
  pure $ messageView' m


messageView' :: Text -> View Message ()
messageView' m = do
  el bold "Message"
  el_ (text m)
  button (SetMessage "Goodbye World") id "Change Message"


messagePage' :: (Hyperbole :> es) => Page es Response
messagePage' = do
  handle message
  load $ do
    pure $ do
      el bold "Message Page"
      hyper Message $ messageView' "Hello World"
